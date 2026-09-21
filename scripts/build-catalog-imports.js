const fs = require('fs');
const loadCatalog = require('./catalog-loader');
const CHUNK_SIZE = Math.max(1, Number(process.env.CATALOG_CHUNK_SIZE || 5000));

const baseSource = fs.readFileSync('catalog.js', 'utf8');
const match = baseSource.match(/window\.catalog\s*=\s*\[/);
if (!match) throw new Error('catalog.js has no window.catalog array');
const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
require('vm').createContext(sandbox);
require('vm').runInContext(baseSource, sandbox);
const baseIds = new Set((sandbox.window.catalog || []).map(item => String(item.id)));
const imported = loadCatalog().filter(item => !baseIds.has(String(item.id)));
for (const file of fs.readdirSync('.').filter(name => /^catalog-imports-\d+\.js$/.test(name))) {
  fs.unlinkSync(file);
}

const chunks = [];
for (let offset = 0; offset < imported.length; offset += CHUNK_SIZE) {
  const records = imported.slice(offset, offset + CHUNK_SIZE);
  const file = `catalog-imports-${Math.floor(offset / CHUNK_SIZE) + 1}.js`;
  fs.writeFileSync(file, `window.catalog.push(...${JSON.stringify(records)});\n`);
  chunks.push({ file, count: records.length });
}

const loader = [
  `window.catalogImportManifest=${JSON.stringify({ total: imported.length, chunkSize: CHUNK_SIZE, chunks })};`,
  'if(typeof document!=="undefined"){',
  '  for(const chunk of window.catalogImportManifest.chunks){',
  '    document.write(`<script src="${chunk.file}"><\\/script>`);',
  '  }',
  '}',
  ''
].join('\n');
fs.writeFileSync('catalog-imports.js', loader);
console.log(`Generated catalog-imports.js with ${imported.length} imported records across ${chunks.length} chunks.`);
