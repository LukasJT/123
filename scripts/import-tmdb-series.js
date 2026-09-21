const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

if (!process.env.TMDB_BEARER_TOKEN) {
  throw new Error('Set TMDB_BEARER_TOKEN before running a catalog series.');
}

const args = Object.fromEntries(process.argv.slice(2).map(value => {
  const [key, raw = 'true'] = value.replace(/^--/, '').split('=');
  return [key, raw];
}));
const kind = args.kind === 'tv' ? 'tv' : 'movie';
const date = args.date || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const batchSize = Math.max(1, Number(args['batch-size'] || 1000));
const maxBatches = Math.max(1, Number(args['max-batches'] || 1));
const stateDirectory = path.join('data', 'import-state');
const stateFile = path.join(stateDirectory, `tmdb-${kind}-${date}.json`);
fs.mkdirSync(stateDirectory, { recursive: true });

let state = { kind, date, nextOffset: 0, batchSize, completedBatches: 0 };
if (fs.existsSync(stateFile)) state = { ...state, ...JSON.parse(fs.readFileSync(stateFile, 'utf8')) };
if (args.offset !== undefined) state.nextOffset = Math.max(0, Number(args.offset));

for (let index = 0; index < maxBatches; index += 1) {
  const commandArgs = [
    path.join('scripts', 'import-tmdb-export.js'),
    `--kind=${kind}`,
    `--date=${date}`,
    `--offset=${state.nextOffset}`,
    `--limit=${batchSize}`
  ];
  const result = spawnSync(process.execPath, commandArgs, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) process.exit(result.status || 1);
  state.nextOffset += batchSize;
  state.completedBatches += 1;
  state.updatedAt = new Date().toISOString();
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
  console.log(`Saved checkpoint at offset ${state.nextOffset} in ${stateFile}`);
}
