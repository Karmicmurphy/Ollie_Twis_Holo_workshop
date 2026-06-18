#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const command = args[0] || '';

if (command !== 'build') {
  console.error(`Twis Holo static build shim only supports: next build`);
  console.error(`Received: next ${args.join(' ')}`);
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const buildScript = resolve(root, 'cloudflare/pages/build.mjs');

console.log('Cloudflare requested `next build`, but this repo is static. Running Twis Holo static Pages build instead.');

const result = spawnSync(process.execPath, [buildScript], {
  cwd: root,
  stdio: 'inherit',
  env: process.env
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 0);
