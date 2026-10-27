#!/usr/bin/env node
// Guard: the locked core must not change. Zero dependencies.
// Reads CORE.lock (lines "<sha256>  <path>") and re-hashes each path.
// `--write` regenerates CORE.lock. Maintainers only; agents must never run it.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCK = 'CORE.lock';
const DIRS = ['src/core', 'test-rules'];
const FILES = [
  'firestore.rules',
  'firebase.json',
  'scripts/check-core.mjs',
  'scripts/check-core.test.mjs',
  'scripts/check-tests.mjs',
  'scripts/check-tests.test.mjs',
  'scripts/check.mjs',
  'vitest.rules.config.ts',
  'vitest.config.ts',
  'package.json',
  'index.html',
  'server.mjs',
  'src/main.ts',
  'vite.config.ts',
  'tsconfig.json',
  '.github/workflows/ci.yml',
];

const HEADER = `# CORE.lock - files the agent must never edit. Checked by: node scripts/check-core.mjs
# Format: <sha256>  <path>   (one per line; hash of the file with CRLF turned into LF)
# Regenerate (maintainers only): node scripts/check-core.mjs --write
# CORE.lock cannot hash itself. Review any diff of this file by hand.
`;

export function hashContent(buf) {
  const text = Buffer.from(buf).toString('latin1').replace(/\r\n/g, '\n');
  return createHash('sha256').update(Buffer.from(text, 'latin1')).digest('hex');
}

function* walk(root, dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return;
  for (const name of readdirSync(abs).sort()) {
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) yield* walk(root, rel);
    else yield rel;
  }
}

export function lockedPaths(root) {
  const out = FILES.filter((f) => existsSync(join(root, f)));
  for (const d of DIRS) out.push(...walk(root, d));
  return [...new Set(out)].sort();
}

export function write(root) {
  const lines = lockedPaths(root).map((p) => `${hashContent(readFileSync(join(root, p)))}  ${p}`);
  writeFileSync(join(root, LOCK), `${HEADER}${lines.join('\n')}\n`);
}

export function check(root) {
  const lockFile = join(root, LOCK);
  if (!existsSync(lockFile)) return [`CORE CHANGED ${LOCK} (missing)`];
  const entries = new Map();
  for (const line of readFileSync(lockFile, 'utf8').split(/\r?\n/)) {
    const m = /^([0-9a-f]{64}) {2}(.+)$/.exec(line);
    if (m) entries.set(m[2], m[1]);
  }
  const problems = [];
  for (const [path, sha] of entries) {
    const abs = join(root, path);
    if (!existsSync(abs) || hashContent(readFileSync(abs)) !== sha) problems.push(`CORE CHANGED ${path}`);
  }
  for (const path of lockedPaths(root)) {
    if (!entries.has(path) && FILES.includes(path)) problems.push(`CORE MISSING ${path}`);
  }
  for (const d of DIRS) {
    for (const path of walk(root, d)) if (!entries.has(path)) problems.push(`CORE CHANGED ${path} (not in ${LOCK})`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  if (process.argv.includes('--write')) {
    write(root);
    process.exit(0);
  }
  const problems = check(root);
  for (const p of problems) console.log(p);
  process.exit(problems.length ? 1 : 0);
}
