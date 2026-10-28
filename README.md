# vibe-to-verified-starter

Starter repo for the DevFest 2026 talk "Fix the Core, Generate the Edges" and the lab in [LAB.md](LAB.md).

A small Q&A board on Firebase. Humans own a small, locked, tested core (`src/core/`, `firestore.rules`,
the rules tests and the check scripts). An agent writes only the edges in `src/ui/`. The rules for the agent are
in [AGENTS.md](AGENTS.md). The list of locked files is in [CORE.lock](CORE.lock).

```sh
npm ci
npm run verify:contract   # type check, unit tests, core check, test check, banned-word check
```

## Make the lock enforceable

`CORE.lock` catches accidental edits: `node scripts/check-core.mjs` fails when a locked file no longer matches its
hash. It does not stop a change that edits a locked file and its hash in `CORE.lock` together, because the lock
lives in the same repo the agent writes to. CODEOWNERS plus required review on the core makes it enforceable.

In your own fork:

1. Add `.github/CODEOWNERS` that names a human reviewer for the core, for example:

   ```
   # Locked core: a human code owner must approve every change here
   /src/core/                 @your-github-user
   /firestore.rules           @your-github-user
   /firebase.json             @your-github-user
   /test-rules/               @your-github-user
   /scripts/                  @your-github-user
   /CORE.lock                 @your-github-user
   /package.json              @your-github-user
   /.github/                  @your-github-user
   ```

2. In the fork's settings, add a branch protection rule (or ruleset) for `main` and turn on:
   - **Require a pull request before merging**
   - **Require review from Code Owners**
   - **Require status checks to pass** with the CI job from `.github/workflows/ci.yml`
   - **Do not allow bypassing the above settings**, so admins and bots follow the same rule

Then an agent can still propose a change to the core, but it cannot merge one. A human code owner reads it first.

This repo does not ship a real CODEOWNERS file, because the owner must be someone in your own fork.
