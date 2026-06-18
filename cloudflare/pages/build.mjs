import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const sourceDir = resolve(root, 'app');
const outputDir = resolve(root, 'dist');

if (!existsSync(sourceDir)) {
  throw new Error('Cloudflare Pages build failed: expected static app directory at ./app');
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(sourceDir, outputDir, { recursive: true });

// SPA fallback for direct visits to client-side routes.
const notFoundPath = resolve(outputDir, '404.html');
const indexPath = resolve(outputDir, 'index.html');
if (existsSync(indexPath) && !existsSync(notFoundPath)) {
  cpSync(indexPath, notFoundPath);
}

writeFileSync(
  resolve(outputDir, '_headers'),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: microphone=(self), camera=(), geolocation=()
`,
  'utf8'
);

console.log('Twis Holo static Pages build complete: ./app -> ./dist');
