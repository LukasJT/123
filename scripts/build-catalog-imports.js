const fs = require('fs');
const loadCatalog = require('./catalog-loader');

const baseSource = fs.readFileSync('catalog.js', 'utf8');
const match = baseSource.match(/window\.catalog\s*=\s*\[/);
if (!match) throw new Error('catalog.js has no window.catalog array');
const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
require('vm').createContext(sandbox);
require('vm').runInContext(baseSource, sandbox);
const baseIds = new Set((sandbox.window.catalog || []).map(item => String(item.id)));
const imported = loadCatalog().filter(item => !baseIds.has(String(item.id)));
fs.writeFileSync('catalog-imports.js', `window.catalog.push(...${JSON.stringify(imported)});\n`);
console.log(`Generated catalog-imports.js with ${imported.length} imported records.`);
