const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');

function loadCatalog() {
  const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('catalog.js', 'utf8'), sandbox);
  return sandbox.window.catalog;
}

test('verified batch has unique IDs, sources, and checked dates', () => {
  const batch = loadCatalog().filter(item => item.batchId === '2026-09-current-films-01');
  assert.equal(batch.length, 3);
  assert.equal(new Set(batch.map(item => item.id)).size, batch.length);
  for (const item of batch) {
    assert.ok(item.sources.length);
    assert.match(item.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('recently viewed records do not invent playback progress', () => {
  const source = fs.readFileSync('catalog.js', 'utf8');
  assert.doesNotMatch(source, /Math\.random\(\).*progress/);
});
