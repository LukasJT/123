const fs = require('fs');
const path = require('path');
const vm = require('vm');

module.exports = function loadCatalog() {
  const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('catalog.js', 'utf8'), sandbox);
  const catalog = sandbox.window.catalog || [];
  const ids = new Set(catalog.map(item => String(item.id)));
  const directory = path.join('data', 'imports');
  if (!fs.existsSync(directory)) return catalog;
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort()) {
    const batch = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
    if (Array.isArray(batch.records)) {
      for (const record of batch.records) {
        if (ids.has(String(record.id))) continue;
        ids.add(String(record.id));
        catalog.push(record);
      }
    }
  }
  return catalog;
};
