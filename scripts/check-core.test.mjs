import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hashContent } from './check-core.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-core.mjs');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'core-'));
  const put = (p, c) => {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), c);
  };
  put('src/core/a.ts', 'export const a = 1;\n');
  put('test-rules/r.test.ts', 'test\n');
  put('firestore.rules', 'rules\n');
  put('firebase.json', '{}\n');
  put('scripts/check-core.mjs', 'x\n');
  return { root, put, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
const run = (root, ...args) =>
  spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });

test('same hash for LF and CRLF content', () => {
  assert.equal(hashContent(Buffer.from('a\nb\n')), hashContent(Buffer.from('a\r\nb\r\n')));
  assert.notEqual(hashContent(Buffer.from('a\n')), hashContent(Buffer.from('b\n')));
});

test('clean tree exits 0', () => {
  const f = fixture();
  assert.equal(run(f.root, '--write').status, 0);
  assert.equal(run(f.root).status, 0);
  f.cleanup();
});

test('CRLF checkout of a locked file still exits 0', () => {
  const f = fixture();
  run(f.root, '--write');
  f.put('src/core/a.ts', 'export const a = 1;\r\n');
  assert.equal(run(f.root).status, 0);
  f.cleanup();
});

test('modified locked file exits 1 and names the path', () => {
  const f = fixture();
  run(f.root, '--write');
  f.put('src/core/a.ts', 'export const a = 2;\n');
  const r = run(f.root);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /CORE CHANGED src\/core\/a\.ts/);
  f.cleanup();
});

test('missing locked file exits 1', () => {
  const f = fixture();
  run(f.root, '--write');
  rmSync(join(f.root, 'firestore.rules'));
  const r = run(f.root);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /CORE CHANGED firestore\.rules/);
  f.cleanup();
});

test('new unlisted file under src/core exits 1', () => {
  const f = fixture();
  run(f.root, '--write');
  f.put('src/core/extra.ts', 'export {};\n');
  const r = run(f.root);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /CORE CHANGED src\/core\/extra\.ts/);
  f.cleanup();
});

test('missing CORE.lock exits 1', () => {
  const f = fixture();
  assert.equal(run(f.root).status, 1);
  f.cleanup();
});

test('deleting a lock line for a canonical file exits 1 with CORE MISSING', () => {
  const f = fixture();
  f.put('package.json', '{}\n');
  run(f.root, '--write');
  const lock = join(f.root, 'CORE.lock');
  const kept = readFileSync(lock, 'utf8').split('\n').filter((l) => !l.endsWith('  package.json'));
  writeFileSync(lock, kept.join('\n'));
  const r = run(f.root);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /CORE MISSING package\.json/);
  f.cleanup();
});

test('package.json, vite.config.ts and tsconfig.json are locked', () => {
  const f = fixture();
  for (const n of ['package.json', 'vite.config.ts', 'tsconfig.json']) f.put(n, 'x\n');
  run(f.root, '--write');
  const lock = readFileSync(join(f.root, 'CORE.lock'), 'utf8');
  for (const n of ['package.json', 'vite.config.ts', 'tsconfig.json']) assert.match(lock, new RegExp(`  ${n.replace('.', '\\.')}$`, 'm'));
  f.cleanup();
});
