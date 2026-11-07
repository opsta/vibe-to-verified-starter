# From Vibe to Verified: lab guide

DevFest Bangkok, Sat 14 Nov 2026. 60 minutes. You build a small Q&A board with an AI agent,
prove it works, and publish it on Cloud Run.

You use: Google Antigravity CLI (`agy`) with the free Gemini 3.8 Flash, Google's Conductor plugin
(spec, plan, build) and our `verified` plugin (verify step, `VERIFY.md`). The core of the app
(`src/core/`) is locked, so the agent can only write the edges (the UI in `src/ui/`).

**Setup is done before the day** (the pre-event email: `agy` installed and signed in, the starter
cloned with `npm ci`, Google Cloud CLI installed and signed in with `gcloud auth login`).
This guide starts from there.

Three human gates. The agent stops at each one and waits for you:

- **Gate 1 spec approved**
- **Gate 2 plan approved**
- **Gate 3 VERIFY.md accepted**

To save time, the spec and the plan are already written on branch `step-1-spec`. You read them and
pass Gates 1 and 2 yourself, then the agent builds.

| Min | Stage | Section | Jump point if stuck |
|---|---|---|---|
| 0-5 | Open, claim the cloud credit | 1 | none |
| 5-10 | Start at `step-1-spec`: read spec and plan, approve | 2 | `step-1-spec` |
| 10-30 | Build: the agent writes the edges on the locked core | 3 | `step-3-build` |
| 30-40 | Verify: `VERIFY.md`, accept | 4 | `step-4-verified` |
| 40-50 | Publish: `gcloud run deploy`, open your own URL | 5 | `step-5-deployed` |
| 50-58 | Speaker demo: push, pipeline, deploy | 6 | none |
| 58-60 | Wrap | 6 | none |

> **Stuck? Out of quota? Jump to a checkpoint.** Every stage ends in a branch that already has
> the result of that stage. Run `git switch step-N-name` (names are in each stage box) and carry on
> from the next stage. If `git switch` complains about local changes, run `git stash -u` first.
> Fallback if nothing works for you: see the box at the end.

---

## Before the event (organiser fills in)

- [x] GitHub org: `opsta` (repos `opsta/antigravity-verified` and `opsta/vibe-to-verified-starter`)
- [ ] `<event-id>`: GDG event credit id for the claim link (section 1)
- [ ] `<YOUR_EVENT_CREDIT_PROJECT>`: shown to attendees by the claim flow (section 5)

---

## 1. Open and claim the credit (minutes 0-5)

Open the claim link on the board (`trygcp.dev/claim/<event-id>`) <!-- verify in dry run -->, sign in with your personal
`@gmail.com`, and accept. No card is needed. The credit takes a few minutes to activate and lasts
about 12 hours, so your published app stops the day after. Write down the project it gives you
(section 5 needs it). If the claim fails, do not worry: use the fallback box at the end for the deploy.

---

## 2. Start at the spec and plan: Gates 1 and 2 (minutes 5-10)

Go to the starter you cloned before the day and switch to the start branch.
No clone yet? Run `git clone --branch step-1-spec https://github.com/opsta/vibe-to-verified-starter` first.

```sh
cd vibe-to-verified-starter
git fetch origin
git switch step-1-spec
npm ci
npm run verify:contract
```

Expected: the last command exits with code 0 (check with `echo $?` on macOS/Linux, `echo $LASTEXITCODE`
in PowerShell).

Check the plugins (the email had them as optional):

```sh
agy plugin list
```

Expected: both `conductor` and `verified` appear. If one is missing, install it now:

```sh
agy plugin install https://github.com/gemini-cli-extensions/conductor
agy plugin install https://github.com/opsta/antigravity-verified
```

### 2.1 Read the spec (Gate 1)

Open `docs/brief.md`, then `conductor/tracks/qa_board_20261028/spec.md`. Check:

- Are all four acceptance criteria from the brief there, word for word, with the `[ui]` tags?
- Does it say the core is read-only?
- Is anything invented that the brief does not ask for?

**Gate 1 spec approved** when it is right. Do not approve to be polite. A wrong spec makes
everything after it wrong.

### 2.2 Read the plan (Gate 2)

Open `conductor/tracks/qa_board_20261028/plan.md`. Check:

- Every task points to `src/ui/`. Anything touching `src/core/`, `CORE.lock` or `scripts/` is wrong.
- Tests are written with the code, in `src/ui/**/*.test.ts`.
- The last task runs `npm run verify:contract`.

**Gate 2 plan approved** when it is right. You tell the agent in the next step.

> **Stuck?** `git switch step-1-spec` gives you the approved spec and plan.

---

## 3. Build (minutes 10-30)

### 3.1 Run the build safely

Start `agy` in the repo folder:

```sh
agy
```

Your safety is **Request Review** mode: every file change and command waits for you. It is the
default, so there is nothing to choose. Check it with `/permissions` inside `agy`.

Do not use `--sandbox`: on Ubuntu with the default AppArmor settings it does nothing and auto mode
refuses to run. Request Review is the protection.

Paste this to start the build:

```
Gate 1 and Gate 2 approved: spec and plan in conductor/tracks/qa_board_20261028/. Build it.
```

The agent normally builds everything in one long turn, writes `src/ui/app.ts` and tests, and may run
`/verify` itself. If it stops before building, say: `Gate 2 approved. Build it.`
Conductor's per-phase manual checks may be skipped; that is fine, Gate 3 is where you check.

Expect about 25-35 approval prompts in one build. Most are Conductor committing after each task
(`git add`, `git commit`, `git notes`), plus file writes in `src/ui/`, `ls`, `find`, `npx vitest` and
`npm run verify:contract`. These are normal: approve them. Refuse only the red flags below.

While it works, review the changes. Look at the full diff at any time:

```
/diff
```

Watch for these red flags and refuse them:

- anything that touches `src/core/`, `CORE.lock`, `scripts/`, `.github/` or `package.json`
  (including a new dependency)
- an edit that deletes, skips or weakens a test

### 3.2 Check the lock

After the build, in your own terminal (not through the agent):

```sh
npm run verify:contract
```

Expected: exit code 0. The core is locked: the store rules and their tests are untouched, so
the rules test is still green even though the agent wrote a whole UI. That is the point of the
lock: the agent can be wrong in `src/ui/`, but it cannot break the part that guards your data.
If it fails, paste the last 20 lines to the agent and ask it to fix `src/ui/` only.

See it run:

```sh
npm run dev
```

Open the address it prints. You should see the list, an ask box and vote buttons.

> **Stuck or out of quota at minute 30?** `git switch step-3-build` gives you a finished build.

---

## 4. Verify: Gate 3 (minutes 30-40)

The build says "done". Now prove it. If the agent already ran `/verify` during the build, read its
`VERIFY.md` below; otherwise run, inside `agy`:

```
/verify
```

The `verified` plugin runs the contract command and starts a fresh read-only checker. For the
`[ui]` criteria the checker may open the app in a browser and take screenshots; if it does not,
the evidence is a UI test, and you can check `npm run dev` yourself. It writes `VERIFY.md`.
Expected: a table with one row per acceptance criterion, with evidence and a result.

Read `VERIFY.md` yourself:

- Every criterion has evidence you can see (a test name, a command exit code, maybe a screenshot).
- **Untested criteria** says `none`. Anything listed there is a gap, not a pass.
- **Tests modified** lists only the new tests in `src/ui/` (for example `src/ui/app.test.ts`).
  That is expected. A test outside `src/ui/` (core or rules tests), or a deleted, skipped or
  weakened test, is a red flag: open the diff and ask why.
- **Core files touched** says `none`.

**Gate 3 VERIFY.md accepted.** If it is honest and complete, tell the agent: `Accepted.` If not,
say what is missing and run `/verify` again. Only a person can pass this gate.

> **Stuck?** `git switch step-4-verified` has a verified build with its `VERIFY.md`.

---

## 5. Publish (minutes 40-50)

Point the Google Cloud CLI at your event credit project (you signed in before the day):

```sh
gcloud projects list
gcloud config set project <YOUR_EVENT_CREDIT_PROJECT>
gcloud config get-value project
```

Expected: the last line prints your event credit project. Use the project made for this lab, not
a work project.

Enable the services Cloud Run needs for a source deploy (first time only, takes about a minute):

```sh
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Deploy:

```sh
gcloud run deploy vtv --source . --region asia-southeast1 --allow-unauthenticated
```

Say yes if it offers to create an Artifact Registry repository. Expected: the first deploy on a
fresh project takes 2-4 minutes (the build plus creating the repository), then it prints `Service URL: https://vtv-....run.app`. Open it.

Without Firebase settings the deployed app uses an in-memory store and a demo user. That is fine
for the lab: you see your own working app on a public URL. To connect a real Firestore later, see
`docs/deploy.md`.

> **Stuck?** `git switch step-5-deployed` is the final state; deploy it with the same command.
> Cloud Run errors: read the last lines of the build log first; the usual cause is billing not
> linked to the project yet (the credit takes a few minutes).

---

## 6. Speaker demo and wrap (minutes 50-60)

Watch, no typing. The speaker pushes to `main` of this repo and the pipeline takes over
(`.github/workflows/ci.yml`, then `.github/workflows/pipeline.yml`):

1. **ci**: unit tests, Firestore rules tests in the emulator, core lock check, test guard.
2. **Secret scan**: gitleaks over every commit.
3. **Deploy**: Cloud Run, signed in with Workload Identity Federation (no JSON keys).
   It runs only when 1 and 2 are green.

In your own fork the deploy job is skipped (it needs repo variables you do not have), so your
runs stay green. Then the A/B numbers: what it costs to read a backend an agent wrote in full,
against a locked core.

Take-home loop: **spec, plan, build, verify, ship**, with a human at each gate.
Keep your repo: `VERIFY.md` is the habit to take home. More: https://g.dev/ai/build

---

## Fallback box (no install, no quota, no Google account that works)

If you cannot use `agy` (age, work account, install failure) or your free quota ran out:

1. Open AI Studio Build in your browser: https://aistudio.google.com/apps (sign in with any
   account AI Studio accepts).
2. Paste the contents of `docs/brief.md` as your prompt and ask for the app.
3. Use its Firebase option when it offers one, and publish from the same screen (Cloud Run
   Starter Tier, no billing needed, up to 2 services).
4. For Gate 3, open the app yourself and check the four criteria one by one. Write what you saw.
<!-- verify in dry run: current AI Studio Build menu names -->

Or stay in the terminal: `git switch step-3-build`, then continue from section 4.

## Troubleshooting

| Problem | Try |
|---|---|
| `agy: command not found` | New terminal; add `~/.local/bin` to `PATH` |
| `npm ci` fails | `node -v` must be an LTS: 22 (22.12+), 24 or 26. Not 23 or 25 |
| Sign-in loop | Use the personal `@gmail.com`; try a private window |
| `gcloud` asks you to sign in | `gcloud auth login` with the same `@gmail.com` |
| `git switch step-1-spec` says invalid reference | `git fetch origin` first |
| `core lock` / `check:core` fails | You or the agent changed a locked file: `git checkout -- src/core CORE.lock` |
| Windows: line-ending noise | Safe: the lock check ignores CRLF |
| Agent edits a test to pass | Refuse it. Say: "Do not change tests. Fix `src/ui/`." |
| Agent wants a new package | Refuse it. The rules say no new dependencies |
| Quota exhausted | `git switch` to the next checkpoint |
