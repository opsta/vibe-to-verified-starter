# From Vibe to Verified: lab guide

DevFest Bangkok, Sat 14 Nov 2026. 90 minutes. You build a small Q&A board with an AI agent,
then prove it works before you ship it.

You use: Google Antigravity CLI (`agy`) with the free Gemini 3.8 Flash, Google's Conductor plugin
(spec, plan, build) and our `verified` plugin (verify step, `VERIFY.md`). The core of the app
(`src/core/`) is locked, so the agent can only write the UI.

Three human gates. The agent stops at each one and waits for you:

- **Gate 1 spec approved**
- **Gate 2 plan approved**
- **Gate 3 VERIFY.md accepted**

| Min | Stage | Section | Jump point if stuck |
|---|---|---|---|
| 0-10 | Think: set up and check `agy` | 1 | `step-0-start` |
| 10-25 | Spec and plan | 2 | `step-1-spec`, `step-2-plan` |
| 25-50 | Build | 3 | `step-3-build` |
| 50-65 | Verify | 4 | `step-4-verified` |
| 65-80 | Publish | 5 | `step-5-deployed` |
| 80-90 | Wrap | 6 | none |

> **Stuck? Out of quota? Jump to a checkpoint.** Every stage ends in a branch that already has
> the result of that stage. Run `git switch step-N-name` (names are in each stage box) and carry on
> from the next stage. If `git switch` complains about local changes, run `git stash -u` first.
> Fallback if nothing works for you: see the box at the end.

---

## Before the event (organiser fills in)

- [x] GitHub org: `opsta` (repos `opsta/antigravity-verified` and `opsta/vibe-to-verified-starter`)
- [ ] `<event-id>`: GDG event credit id for the claim link (section 1.5)
- [ ] `<YOUR_EVENT_CREDIT_PROJECT>`: shown to attendees by the claim flow (section 5)

---

## 1. Set up (minutes 0-10)

You need: a personal `@gmail.com` account (18 or older; work and school accounts do not work for
Antigravity), Git, Python 3 (Conductor setup uses it), Node.js 22.12 or newer (LTS 24 recommended), and a terminal. Check with `node -v`: it must print v22.12 or higher.

### 1.1 Install `agy`

Do this before the day if you can. Pick your system.

macOS or Linux:

```sh
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

macOS alternative, with Homebrew:

```sh
brew install --cask antigravity-cli
```

Windows (PowerShell):

```powershell
irm https://antigravity.google/cli/install.ps1 | iex
```

Check:

```sh
agy --version
```

Expected: a version number. If the command is not found, open a new terminal window. On
macOS/Linux the binary is `~/.local/bin/agy`; add that folder to your `PATH` if needed.
<!-- verify in dry run: exact version output -->

### 1.2 Sign in and check your quota

```sh
agy
```

Expected: your browser opens, you sign in with your `@gmail.com`, and you accept workspace trust
when asked. Over SSH, `agy` prints a URL; open it, then paste the code back.
<!-- verify in dry run: first-run prompts and wording -->

Inside `agy`, type:

```
/usage
```

Use this privately: do not put the output on a shared screen (it also lists model groups that are not part of this lab). Expected: your free plan and its weekly quota. The free model is Gemini 3.8 Flash. The quota
number is not published, so keep prompts small. Leave `agy` with `/exit` (or Ctrl+C twice).
<!-- verify in dry run: exit command -->

### 1.3 Get the starter

```sh
git clone https://github.com/opsta/vibe-to-verified-starter
cd vibe-to-verified-starter
npm ci
npm run verify:contract
```

Expected: the last command exits with code 0 (check with `echo $?` on macOS/Linux, `echo $LASTEXITCODE`
in PowerShell).

Read `AGENTS.md` and `docs/brief.md` (2 minutes). The brief has four acceptance criteria. They are
the target for everything that follows.

### 1.4 Install the two plugins

```sh
agy plugin install https://github.com/gemini-cli-extensions/conductor   # verify in dry run
agy plugin install https://github.com/opsta/antigravity-verified
agy plugin list
```

Expected: both `conductor` and `verified` appear in the list.
<!-- verify in dry run: plugin list output -->

### 1.5 Claim the event credit (needed in section 5)

Open the claim link on the board (`trygcp.dev/claim/<event-id>`) <!-- verify in dry run -->, sign in with your personal
`@gmail.com`, and accept. No card is needed. Allow a few minutes for the credit to activate.
Write down the project or billing account name it gives you. If the claim fails, do not worry:
use the fallback box at the end for the deploy.

> **Stuck in stage 1?** Branch `step-0-start` is the clean starter. Install trouble with `agy`
> itself: do the fallback box.

---

## 2. Spec and plan (minutes 10-25)

### 2.1 Set up Conductor once (about 4 minutes)

In the repo folder, start `agy` and run the Conductor setup:

```sh
agy
```

```
/conductor-setup
```
<!-- verify in dry run: slash name -->

Setup runs a small Python script (`scripts/resume.py`) to check the project state. You need Python 3 installed, and in Request Review mode you will be asked to approve that command: approve it.

If a command isn't found, type `/` and pick the Conductor (or verify) entry from the list.

Conductor asks questions one at a time. Answer like this. Whenever it offers a mode, choose
**Autogenerate** (it fits the 4-minute budget). Interactive mode is for at home.

| Conductor asks about | Answer |
|---|---|
| Project type (new or existing) | Existing project (the starter) |
| Product definition | "A Q&A board for DevFest. Read `docs/brief.md`." |
| Tech stack | "As in `package.json`: TypeScript, Vite, Vitest, Firebase." |
| Code style guides | TypeScript only |
| **Workflow** | **Customize** (not Default) |
| **Coverage percentage** (open question) | **0** (this turns off the default 80% rule; our own contract command is the check) |
| Commit frequency | After each task |
| Summary storage | Git notes, or the option that adds no extra files |
| Extra agent skills | None / skip |

If the Workflow question is skipped and you got the default, open `conductor/workflow.md` and
replace every `80%` / `>80%` with `0%` (or ask the agent: "Remove the 80% coverage requirement
from conductor/workflow.md"). Also say "Do not add dependencies" if asked about tooling.
<!-- verify in dry run: real question order and wording -->

Expected: a new `conductor/` folder with `product.md`, `tech-stack.md`, `workflow.md` and `index.md`.

### 2.2 Write the spec (Gate 1)

Still in `agy`:

```
/conductor-new-track
```

When asked what to build, paste:

```
Build the Q&A board described in docs/brief.md. Use only the QuestionStore interface in
src/core/store.ts. Write code only in src/ui/. Copy the four acceptance criteria from the brief
into the spec as they are, keeping the [ui] tags.
```

Conductor asks a few questions and then shows `spec.md`. Read it:

- Are all four acceptance criteria there, word for word?
- Does it say the core is read-only?
- Is anything invented that the brief does not ask for? Tell the agent to remove it.

**Gate 1 spec approved.** Only when it is right, tell the agent: `Approved.` Do not approve to be
polite. A wrong spec makes everything after it wrong.
<!-- verify in dry run: new-track question list, where spec.md is written (conductor/tracks/...) -->

> **Stuck?** `git switch step-1-spec` gives you the repo with the approved spec.

### 2.3 Write the plan (Gate 2)

Conductor now proposes `plan.md`: phases and tasks. Check:

- Every task points to `src/ui/`. Anything touching `src/core/`, `CORE.lock` or `scripts/` is wrong.
- Tests are written with the code, in `src/ui/**/*.test.ts`.
- The last task runs `npm run verify:contract`.

**Gate 2 plan approved.** Tell the agent: `Approved.`

> **Stuck?** `git switch step-2-plan` gives you spec and plan approved.

---

## 3. Build (minutes 25-50)

### 3.1 Run the build safely

Your safety is **Request Review** mode: every file change and command waits for you. Choose it
in `agy` as the approval mode.
<!-- verify in dry run: exact way to pick Request Review (flag or /settings) -->

Optional: start `agy --sandbox` where your OS supports it. **Linux note:** on Ubuntu with the
default AppArmor settings (unprivileged user namespaces blocked) the sandbox does nothing and
auto mode refuses to run. Do not rely on it; Request Review is the protection.

After you approve the plan (Gate 2), the agent normally builds everything in one long turn, writes `src/ui/app.ts` and tests, and may run `/verify` itself. You do not
need to type `/conductor-implement`. If the agent stops before building, say: `Gate 2 approved. Build it.`
Conductor's per-phase manual checks may be skipped; that is fine, Gate 3 is where you check.

While it works, review the changes. Look at the full diff at any time:

```
/diff
```
<!-- verify in dry run: /diff output -->

Watch for these red flags and refuse them:

- an edit to `src/core/`, `CORE.lock` or `scripts/`
- an edit that deletes, skips or weakens a test
- a new dependency in `package.json`

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
<!-- verify in dry run: dev server address and what the page shows -->

> **Stuck or out of quota?** `git switch step-3-build` gives you a finished build.

---

## 4. Verify (minutes 50-65)

The build says "done". Now prove it. If the agent already ran `/verify` during the build, read its `VERIFY.md` below; otherwise run:

```
/verify
```
<!-- verify in dry run: slash name -->

The `verified` plugin runs the contract command, starts a fresh read-only checker, and (for the
`[ui]` criteria) opens the app in a browser and takes screenshots. It writes `VERIFY.md`.
Expected: a table with one row per acceptance criterion, with evidence and a result.
<!-- verify in dry run: browser check steps and screenshot location -->

Read `VERIFY.md` yourself:

- Every criterion has evidence you can see (a test name, a command exit code, a screenshot).
- **Untested criteria** says `none`. Anything listed there is a gap, not a pass.
- **Tests modified** says `none`. If a test changed, open the diff and ask why.
- **Core files touched** says `none`.

**Gate 3 VERIFY.md accepted.** If it is honest and complete, tell the agent: `Accepted.` If not,
say what is missing and run `/verify` again. Only a person can pass this gate.

> **Stuck?** `git switch step-4-verified` has a verified build with its `VERIFY.md`.

---

## 5. Publish (minutes 65-80)

Install the Google Cloud CLI if you do not have it: https://cloud.google.com/sdk/docs/install,
then:

```sh
gcloud auth login
gcloud projects list
gcloud config set project <YOUR_EVENT_CREDIT_PROJECT>
gcloud config get-value project
```

Expected: the last line prints your event credit project. Use a project made for this lab, not
a work project.

Enable the services Cloud Run needs for a source deploy (first time only, takes about a minute):

```sh
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Deploy:

```sh
gcloud run deploy vtv --source . --region asia-southeast1 --allow-unauthenticated
```

Say yes if it offers to create an Artifact Registry repository. Expected: a build runs for a few
minutes, then it prints `Service URL: https://vtv-....run.app`. Open it.
<!-- verify in dry run: prompts, build time, final output -->

Without Firebase settings the deployed app uses an in-memory store and a demo user. That is fine
for the lab: you see your own working app on a public URL. To connect a real Firestore, see
`docs/deploy.md` (optional, only if you have time; use the Firebase console for the Firebase steps,
the `firebase projects:addfirebase` command can fail with 403). The deploy takes about 2 minutes.

> **Stuck?** `git switch step-5-deployed` is the final state. Cloud Run errors: read the last
> lines of the build log first; the usual cause is billing not linked to the project yet.

---

## 6. Wrap (minutes 80-90)

The speaker shows the same task in the Antigravity App on a paid plan, then the limits of this
approach and the next steps of an AI-assisted delivery process. Keep your repo: `VERIFY.md` is the
habit to take home.

Take-home loop: **spec, plan, build, verify, ship**, with a human at each gate.

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
| Sign-in loop | Use the personal `@gmail.com`; try a private window |
| `core lock` / `check:core` fails | You or the agent changed a locked file: `git checkout -- src/core CORE.lock` |
| Windows: line-ending noise | Safe: the lock check ignores CRLF |
| Agent edits a test to pass | Refuse it. Say: "Do not change tests. Fix `src/ui/`." |
| Agent wants a new package | Refuse it. The rules say no new dependencies |
| Quota exhausted | `git switch` to the next checkpoint |
