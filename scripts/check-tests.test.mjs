import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'check-tests.mjs');
function run(files) {
  const root = mkdtempSync(join(tmpdir(), 'ct-'));
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), c);
  }
  const r = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  rmSync(root, { recursive: true, force: true });
  return r;
}

test('clean tests exit 0', () => {
  assert.equal(run({ 'src/ui/a.test.ts': 'it("x", () => { expect(1).toBe(1); });\n' }).status, 0);
});
for (const bad of ['it.skip("x", f)', 'describe.only("x", f)', 'it.todo("x")', 'expect(true).toBe(true)', 'expect( true )']) {
  test(`fails on ${bad}`, () => {
    const r = run({ 'src/ui/a.test.ts': `${bad}\n` });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /BAD TEST src\/ui\/a\.test\.ts:1/);
  });
}
test('ignores non-test files', () => {
  assert.equal(run({ 'src/ui/a.ts': 'it.skip("x")\n' }).status, 0);
});
