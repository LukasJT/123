const fs = require('fs');
const vm = require('vm');

const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('catalog.js', 'utf8'), sandbox);
const catalog = require('./catalog-loader')();
const errors = [];
const ids = new Set();
const normalized = new Map();
const legacyDuplicateKeys = new Set([
  'inception|2010|movie','whiplash|2014|movie','atomicblonde|2017|movie','tropicthunder|2008|movie',
  'looper|2012|movie','annihilation|2018|movie','nocountryforoldmen|2007|movie','drive|2011|movie',
  'thedeparted|2006|movie','officespace|1999|movie','thisistheend|2013|movie','moonlight|2016|movie',
  'thegame|1997|movie','misery|1990|movie','skycastle|2018|tv','drishyam|2015|movie'
]);
const keyFor = item => `${String(item.title).toLowerCase().replace(/[^a-z0-9]/g, '')}|${item.year}|${item.kind}`;

for (const item of catalog) {
  if (ids.has(item.id)) errors.push(`duplicate id ${item.id}`);
  ids.add(item.id);
  const key = keyFor(item);
  (normalized.get(key) || normalized.set(key, []).get(key)).push(item.id);
  if (item.batchId) {
    if (!item.addedAt || !item.updatedAt || !item.verifiedAt) errors.push(`${item.id}: missing batch dates`);
    if (!Array.isArray(item.sources) || !item.sources.length) errors.push(`${item.id}: missing sources`);
  }
}
for (const [key, matches] of normalized) {
  if (matches.length > 1 && !legacyDuplicateKeys.has(key)) errors.push(`new duplicate candidate ${key}: ${matches.join(', ')}`);
}

for (const file of fs.readdirSync('.').filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  if (/"ratingCount"\s*:\s*"1000"/.test(html)) errors.push(`${file}: invented ratingCount`);
  for (const href of html.matchAll(/href=["']([^"'#]+)(?:#[^"']*)?["']/g)) {
    const target = href[1].split('?')[0];
    if (target.includes('${')) continue;
    if (/^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(target) || !target) continue;
    if (!fs.existsSync(target)) errors.push(`${file}: broken link ${href[1]}`);
  }
}

for (const file of fs.readdirSync('.').filter(name => /^sitemap(?:-pages-\d+)?\.xml$/.test(name))) {
  const xml = fs.readFileSync(file, 'utf8');
  const urlCount = [...xml.matchAll(/<url>/g)].length;
  if (urlCount > 45000) errors.push(`${file}: contains ${urlCount} URLs; maximum configured size is 45000`);
  for (const match of xml.matchAll(/<sitemap><loc>https:\/\/123videos\.net\/([^<]+)<\/loc><\/sitemap>/g)) {
    if (!fs.existsSync(match[1])) errors.push(`${file}: missing sitemap file ${match[1]}`);
  }
}

if (fs.existsSync('catalog-imports.js')) {
  const source = fs.readFileSync('catalog-imports.js', 'utf8');
  const manifestMatch = source.match(/window\.catalogImportManifest=(\{.*\});/);
  if (!manifestMatch) {
    errors.push('catalog-imports.js: missing import manifest');
  } else {
    const manifest = JSON.parse(manifestMatch[1]);
    const chunkTotal = manifest.chunks.reduce((sum, chunk) => sum + chunk.count, 0);
    if (chunkTotal !== manifest.total) errors.push(`catalog-imports.js: manifest total ${manifest.total} does not match chunk total ${chunkTotal}`);
    for (const chunk of manifest.chunks) {
      if (!fs.existsSync(chunk.file)) errors.push(`catalog-imports.js: missing chunk ${chunk.file}`);
    }
  }
}

if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  process.exit(1);
}
console.log(`Validated ${catalog.length} catalog records and generated HTML; no new duplicate candidates or broken local links.`);
