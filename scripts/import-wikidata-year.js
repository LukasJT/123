const fs = require('fs');
const path = require('path');
const loadCatalog = require('./catalog-loader');

(async () => {
const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, raw = 'true'] = value.replace(/^--/, '').split('=');
  return [key, raw];
}));
const year = Number(args.year || 1900);
const limit = Math.max(1, Number(args.limit || 500));
const offset = Math.max(0, Number(args.offset || 0));
if (!Number.isInteger(year) || year < 1888 || year > new Date().getUTCFullYear()) {
  throw new Error('Pass a valid film year with --year=YYYY.');
}

const endpoint = 'https://en.wikipedia.org/w/api.php';
const checked = new Date().toISOString().slice(0, 10);
const batchId = `wikidata-films-${year}-${offset}-${offset + limit - 1}`;
async function getJson(parameters) {
  const url = `${endpoint}?${new URLSearchParams({ ...parameters, format: 'json', origin: '*' })}`;
  const response = await fetch(url, { headers: { 'User-Agent': '123VideosCatalog/1.0 (https://123videos.net/contact.html)' } });
  if (!response.ok) throw new Error(`Wikipedia API failed: ${response.status} ${await response.text()}`);
  return response.json();
}

const members = [];
let cmcontinue;
do {
  const data = await getJson({
    action: 'query',
    list: 'categorymembers',
    cmtitle: `Category:${year} films`,
    cmtype: 'page',
    cmlimit: '500',
    ...(cmcontinue ? { cmcontinue } : {})
  });
  members.push(...data.query.categorymembers);
  cmcontinue = data.continue?.cmcontinue;
} while (cmcontinue);

const selected = members
  .filter(item => !/^List of\b/i.test(item.title))
  .sort((a, b) => a.title.localeCompare(b.title))
  .slice(offset, offset + limit);
const pages = [];
for (let cursor = 0; cursor < selected.length; cursor += 50) {
  const pageids = selected.slice(cursor, cursor + 50).map(item => item.pageid).join('|');
  const data = await getJson({ action: 'query', pageids, prop: 'pageprops|description' });
  pages.push(...Object.values(data.query.pages));
}
const existing = new Set(loadCatalog()
  .filter(item => item.batchId !== batchId)
  .map(item => `${String(item.title).toLowerCase().replace(/[^a-z0-9]/g, '')}|${item.year}|${item.kind}`));
const records = pages.map(page => {
  const qid = page.pageprops?.wikibase_item;
  const source = qid ? `https://www.wikidata.org/wiki/${qid}` : `https://en.wikipedia.org/?curid=${page.pageid}`;
  return {
    id: qid ? `wikidata-${qid}` : `enwiki-${page.pageid}`,
    externalIds: qid ? { wikidata: qid } : { enwiki: page.pageid },
    kind: 'movie',
    title: page.title,
    year,
    releaseDate: null,
    quality: '',
    rating: '',
    duration: '',
    runtimeMinutes: undefined,
    genres: [],
    section: 'catalog',
    poster: '',
    desc: page.description || `${page.title} is a ${year} film listed in the 123Videos informational catalog.`,
    batchId,
    addedAt: checked,
    updatedAt: checked,
    verifiedAt: checked,
    sources: [source]
  };
}).filter(record => {
  const key = `${record.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${record.year}|${record.kind}`;
  if (existing.has(key)) return false;
  existing.add(key);
  return true;
});
fs.mkdirSync(path.join('data', 'imports'), { recursive: true });
const output = path.join('data', 'imports', `${batchId}.json`);
fs.writeFileSync(output, JSON.stringify({ id: batchId, source: endpoint, verifiedAt: checked, year, offset, limit, records }, null, 2) + '\n');
console.log(`Wrote ${records.length} unique ${year} films to ${output} from ${members.length} category entries.`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
