const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');

const token = process.env.TMDB_BEARER_TOKEN;
if (!token) throw new Error('Set TMDB_BEARER_TOKEN to an authorized TMDB API Read Access Token.');
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, raw = 'true'] = value.replace(/^--/, '').split('=');
  return [key, raw];
}));
const kind = args.kind === 'tv' ? 'tv' : 'movie';
const limit = Math.max(1, Number(args.limit || 1000));
const offset = Math.max(0, Number(args.offset || 0));
const date = args.date || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const [year, month, day] = date.split('-');
const exportUrl = `https://files.tmdb.org/p/exports/${kind === 'tv' ? 'tv_series' : 'movie'}_ids_${month}_${day}_${year}.json.gz`;
const checked = new Date().toISOString().slice(0, 10);
const batchId = `tmdb-${kind}-${date}-${offset}-${offset + limit - 1}`;

const response = await fetch(exportUrl);
if (!response.ok) throw new Error(`TMDB export failed: ${response.status} ${exportUrl}`);
const ids = [];
const input = readline.createInterface({ input: require('stream').Readable.fromWeb(response.body).pipe(zlib.createGunzip()), crlfDelay: Infinity });
let index = 0;
for await (const line of input) {
  if (index >= offset && ids.length < limit) ids.push(JSON.parse(line).id);
  index += 1;
  if (ids.length === limit) break;
}

const genreResponse = await fetch(`https://api.themoviedb.org/3/genre/${kind}/list?language=en`, { headers: { Authorization: `Bearer ${token}` } });
if (!genreResponse.ok) throw new Error(`TMDB genre request failed: ${genreResponse.status}`);
const genreMap = new Map((await genreResponse.json()).genres.map(item => [item.id, item.name]));
const records = [];
for (let cursor = 0; cursor < ids.length; cursor += 10) {
  const group = ids.slice(cursor, cursor + 10);
  const results = await Promise.all(group.map(async id => {
    const result = await fetch(`https://api.themoviedb.org/3/${kind}/${id}?language=en`, { headers: { Authorization: `Bearer ${token}` } });
    if (result.status === 404) return null;
    if (!result.ok) throw new Error(`TMDB ${kind}/${id} failed: ${result.status}`);
    return result.json();
  }));
  for (const item of results.filter(Boolean)) {
    const release = kind === 'tv' ? item.first_air_date : item.release_date;
    const title = kind === 'tv' ? item.name : item.title;
    if (!title || !release) continue;
    records.push({
      id: `tmdb-${kind}-${item.id}`,
      externalIds: { tmdb: item.id },
      kind,
      title,
      year: release.slice(0, 4),
      releaseDate: release,
      quality: '',
      rating: '',
      duration: '',
      runtimeMinutes: kind === 'movie' && Number.isInteger(item.runtime) ? item.runtime : undefined,
      genres: (item.genres || []).map(genre => genreMap.get(genre.id) || genre.name).filter(Boolean),
      section: kind === 'tv' ? 'shows' : 'catalog',
      poster: '',
      desc: item.overview || `${title} is listed in the 123Videos informational catalog.`,
      batchId,
      addedAt: checked,
      updatedAt: checked,
      verifiedAt: checked,
      sources: [`https://www.themoviedb.org/${kind === 'tv' ? 'tv' : 'movie'}/${item.id}`]
    });
  }
  process.stdout.write(`\rFetched ${Math.min(cursor + 10, ids.length)}/${ids.length}`);
}

fs.mkdirSync(path.join('data', 'imports'), { recursive: true });
const output = path.join('data', 'imports', `${batchId}.json`);
fs.writeFileSync(output, JSON.stringify({ id: batchId, source: exportUrl, verifiedAt: checked, offset, limit, records }, null, 2) + '\n');
console.log(`\nWrote ${records.length} records to ${output}`);
