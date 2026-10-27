#!/usr/bin/env node
// Guard: UI tests must not be disabled or hollow. Zero dependencies.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const BAD = [/\.skip\s*\(/, /\.only\s*\(/, /\bit\.todo\s*\(/, /\btest\.todo\s*\(/, /expect\(\s*true\s*\)/];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.test\.ts$/.test(name)) yield p;
  }
}

export function check(root) {
  const bad = [];
  let files = [];
  try { files = [...walk(join(root, 'src'))]; } catch { /* no src */ }
  for (const p of files) {
    const rel = relative(root, p).split(sep).join('/');
    readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      if (BAD.some((re) => re.test(line))) bad.push(`BAD TEST ${rel}:${i + 1}`);
    });
  }
  return bad;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bad = check(process.cwd());
  for (const b of bad) console.log(b);
  process.exit(bad.length ? 1 : 0);
}
