# From Vibe to Verified: lab guide

DevFest Bangkok, Sun 15 Nov 2026. 60 minutes. You build a small Q&A board with an AI agent,
prove it works, and publish it on Cloud Run.

You use: Google Antigravity CLI (`agy`) with the free Gemini 3.8 Flash, Google's Conductor plugin
(spec, plan, build) and our `verified` plugin (verify step, `VERIFY.md`). The core of the app
(`src/core/`) is locked, so the agent can only write the edges (the UI in `src/ui/`).

**You work in Google Cloud Shell**: a Linux terminal in your browser, with Node, git and the Google
Cloud CLI already installed. Nothing to install on your laptop. Setup takes about 5 minutes in the
room (section 0). Cannot use Cloud Shell (under 18, Google does not know your age, or only a work
account)? Use [Appendix A: install on your own laptop](#appendix-a-install-on-your-own-laptop) or
the [fallback box](#fallback-box-no-terminal-works-for-you).

Three human gates. The agent stops at each one and waits for you:

- **Gate 1 spec approved**
- **Gate 2 plan approved**
- **Gate 3 VERIFY.md accepted**

To save time, the spec and the plan are already written on branch `step-1-spec`. You read them and
pass Gates 1 and 2 yourself, then the agent builds.

| Min | Stage | Section | Jump point if stuck |
|---|---|---|---|
| before 0 | Set up Cloud Shell: `agy`, sign in, clone the starter | 0 | none |
| 0-5 | Claim the cloud credit, make and link your project, enable the services (may use the start buffer) | 1 | none |
| 5-10 | Start at `step-1-spec`: read spec and plan, approve | 2 | `step-1-spec` |
| 10-40 | Build and verify: the agent writes the edges on the locked core, runs `/verify`, you accept `VERIFY.md` | 3-4 | `step-3-build`, `step-4-verified` |
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
- [ ] Claim link and QR code on the screen (section 1); attendees make their own project and link it to the credit

---

## 0. Set up Cloud Shell (before minute 0, about 5 minutes)

### 0.1 Open Cloud Shell

Open https://shell.cloud.google.com and sign in with your personal `@gmail.com` (you must be 18 or
older). The first time you use it:

- accept the Google Cloud terms of service, and
- click **Authorize** when the "Authorize Cloud Shell" dialog asks (it appears the first time a
  command needs your account).

Leave **ephemeral mode off** (that is the default): ephemeral mode throws your files away.
The first start of the day can take 2-3 minutes; after that it opens in seconds.

### 0.2 Install `agy`

Cloud Shell already has an older `agy` in `/usr/bin`. Install the current one with the official
installer, then reload your shell so the new one comes first:

```sh
curl -fsSL https://antigravity.google/cli/install.sh | bash
source ~/.bashrc
agy --version
```

Expected: version 1.5 or newer. Still 1.4? You are running the old one: run `source ~/.bashrc` again.

### 0.3 Sign in

```sh
agy
```

1. "Select login method": choose **1. Google OAuth**. Never choose option 2 ("Use a Google Cloud
   project"): it bills that project.
2. Click **Click here to authenticate**, choose your `@gmail.com`, then **Sign in**.
3. The page shows a code. Click **Copy to Clipboard**, go back to Cloud Shell, paste it
   (Ctrl+V, or Cmd+V on a Mac) and press Enter.
4. Pick a colour scheme. On **Terms of Service & Data Use**, the box that lets Google collect and use
   your Interactions data is ticked by default. You may untick it (Enter on the box), then choose
   **Done**.
5. Look at the model name at the bottom of the screen. If it is not Gemini 3.8 Flash (some paid
   plans start on a larger model), type `/model` and choose **Gemini 3.8 Flash**.
6. Leave with `/exit`.

### 0.4 Get the starter

```sh
git clone --branch step-1-spec https://github.com/opsta/vibe-to-verified-starter
```

You continue in this folder in section 2. Cloud Shell keeps your home folder, so if the tab
disconnects, open it again and run `cd vibe-to-verified-starter`.

---

## 1. Claim the credit and make your project (minutes 0-5)

This step may use the start buffer before minute 0. You need a smartphone for one check.

1. Open the claim link shown on the screen (or scan the QR code on the slide) on your laptop.
2. Sign in with your personal `@gmail.com` (the same account as your Chrome profile).
3. A Google Developer Program profile is required. If you are asked, click **Create profile** and
   finish it.
4. Scan the QR code the page shows with your smartphone to prove you are human.
5. Click **Claim Credit**. No card is needed.
6. Wait 3-5 minutes. Then click **Open Billing Account**. The credit is a new billing account named
   like `[date] GDP Credit: XXXX-...`. It is not a project: you make the project yourself below.

The credit lasts about 12 hours, so your published app stops the day after.
If the claim fails, do not worry: use the fallback box at the end for the deploy.

Then, still in minutes 2-5, in Cloud Shell: make a project, link it to the credit, point the Google
Cloud CLI at it and enable the services now. Why now: the APIs need about a minute before the first
deploy works, so by section 5 they are ready.

In Cloud Shell, `gcloud config set project` does not last: every new tab or reconnect starts a fresh
gcloud configuration. So put the project in `~/.bashrc` instead, where every tab picks it up.

```sh
gcloud billing accounts list
BILLING_ACCOUNT=$(gcloud billing accounts list --filter="open=true AND displayName~'GDP Credit'" --format='value(name.basename())' | head -n 1)
echo "$BILLING_ACCOUNT"
PROJECT_ID="vtv-$(date +%s)-$RANDOM"
gcloud projects create "$PROJECT_ID"
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
echo "export CLOUDSDK_CORE_PROJECT=$PROJECT_ID" >> ~/.bashrc
source ~/.bashrc
gcloud config get-value project
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

Expected: `gcloud billing accounts list` shows an open account named `GDP Credit...`, `echo` prints
its ID (like `01ABCD-23EFGH-45IJKL`), and `gcloud config get-value project` prints your new `vtv-...`
project. Project IDs are global, so the date and a random number keep yours unique. If Cloud Shell
asks you to authorize, click **Authorize**.

- `echo "$BILLING_ACCOUNT"` prints nothing: the credit is not visible yet. Wait 1-2 minutes and run
  the `BILLING_ACCOUNT=` line again. Still empty after 5 minutes? Check the claim page said it
  succeeded, and that Cloud Shell uses the same `@gmail.com`.
- `services enable` says billing is not enabled: the link has not landed yet. Wait a minute and run
  it again.

---

## 2. Start at the spec and plan: Gates 1 and 2 (minutes 5-10)

Go to the starter you cloned in section 0 and make sure you are on the start branch.
No clone yet? Run `git clone --branch step-1-spec https://github.com/opsta/vibe-to-verified-starter` first.

```sh
cd vibe-to-verified-starter
git fetch origin
git switch step-1-spec
npm ci
npm run verify:contract
```

Expected: the last command exits with code 0 (check with `echo $?`).

Check the plugins:

```sh
agy plugin list
```

Expected: both `conductor` and `verified` appear. Cloud Shell also lists two Google plugins that come
with it; that is fine. If `conductor` or `verified` is missing, install it now:

```sh
agy plugin install https://github.com/gemini-cli-extensions/conductor
agy plugin install https://github.com/opsta/antigravity-verified
```

### 2.1 Read the spec (Gate 1)

Open `docs/brief.md`, then `conductor/tracks/qa_board_20261028/spec.md` (in Cloud Shell:
`cloudshell edit docs/brief.md`, or the **Open Editor** button). Check:

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

## 3. Build (minutes 10-40, together with section 4)

Build and verify are one stage of 30 minutes: the agent builds, then runs `/verify` itself, and you
pass Gate 3 inside the same window. In our test runs the build took 6 to 16 minutes from the paste
below to `VERIFY.md`; the rest of the window is buffer for reading prompts and for slower runs.

### 3.1 Run the build safely

Start `agy` in the repo folder (the first time in a folder it asks whether you trust it: yes):

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
The agent can be quiet for a minute or two after a commit while it thinks: that is normal.

**How to answer the approval prompts.** Expect 12 to 35 prompts in the whole build: about two thirds
are commands, the rest are file changes. Answer them like this:

- **Commands**: the first time each of these asks, choose option 2,
  **`2. Yes, and always allow in this conversation for commands that start with '<prefix>'`**:
  `git` commands (Conductor runs `git add`, `git commit`, `git notes`, `git log`, `git status` and
  `git diff`), `npm run verify:contract`, `npm test`, `npx vitest`, `npx tsc`, `ls`, `cat`, `grep`.
  They only check, read or record your work. For any other command, choose `1. Yes, run command`.
- **Never choose option 3** (`... (Persist to settings.json)`): it keeps the allowance after the lab,
  for every project.
- The allowance is per git subcommand: `git add` and `git commit` each ask once. Commands joined
  with `&&` ask again for each part. An allowed command may ask once more after the checker
  returns. Each time, choose option 2 again.
- **File edits**: there is no "always" option. Approve them one by one (`1. Yes, accept this change`
  or `1. Yes, allow creation`), and read each one. This is where you catch a red flag.

If you choose **No**, the agent stops the whole turn and asks what to do instead. Type it, for example:
`Keep the existing tests, add new ones, continue.`

A small fix in `src/ui/app.test.ts` after a type error (for example `items[0]` becoming `items[0]?`)
is normal: the test still checks the same thing. Deleting or replacing a test is not.

While it works, review the changes. Look at the full diff at any time:

```
/diff
```

Watch for these red flags and refuse them:

- anything that touches `src/core/`, `CORE.lock`, `scripts/`, `.github/` or `package.json`
  (including a new dependency)
- an edit that deletes, skips or weakens a test

### 3.2 Check the lock

After the build, open a second Cloud Shell tab (the **+** button) so `agy` keeps running in the
first one. In that second tab (your own terminal, not the agent):

```sh
cd vibe-to-verified-starter
npm run verify:contract
echo $?
```

Expected: exit code 0. The core is locked: the store rules and their tests are untouched, so
the rules test is still green even though the agent wrote a whole UI. That is the point of the
lock: the agent can be wrong in `src/ui/`, but it cannot break the part that guards your data.
If it fails, paste the last 20 lines to the agent and ask it to fix `src/ui/` only.

See it run:

```sh
npm run dev -- --port 8080
```

Then click **Web Preview** (top right of Cloud Shell) > **Preview on port 8080**. You should see the
list, an ask box and vote buttons. The preview address works only for you; to show your app to
someone else, use your Cloud Run URL from section 5. Stop the server with Ctrl+C when you are done.

> **Stuck or out of quota at minute 30 with no build yet?** `git switch step-3-build` gives you a
> finished build: start `agy` there and run `/verify` (section 4).

---

## 4. Verify: Gate 3 (still minutes 10-40)

The build says "done". Now prove it. If the agent already ran `/verify` during the build, read its
`VERIFY.md` below; otherwise run, inside `agy`:

```
/verify
```

The `verified` plugin runs the contract, the tests, `git diff --stat` and `git status` itself
(answer with option 2 as before), then hands their output to a fresh read-only checker that only
reads files. The browser check runs only if you give the agent an app URL; in Cloud Shell expect a
UI test as the evidence and check the app yourself in Web Preview. It writes `VERIFY.md`.
**The screen may stay quiet for about a minute while the checker works.** That is normal: wait,
do not cancel.
Expected: a table with one row per acceptance criterion, with evidence and a result.

Read `VERIFY.md` yourself:

- Every criterion has evidence you can see (a test name, a command exit code, the test output).
- A row marked `not evidenced: <why>` is a gap, not a pass: ask the agent to add a test for it,
  then run `/verify` again.
- **Untested criteria** says `none`. Anything listed there is a gap, not a pass.
- **Tests modified** lists only the new tests in `src/ui/` (for example `src/ui/app.test.ts`).
  That is expected. A test outside `src/ui/` (core or rules tests), or a deleted, skipped or
  weakened test, is a red flag: open the diff and ask why.
- **Core files touched** says `none`.

**Gate 3 VERIFY.md accepted.** If it is honest and complete, tell the agent: `Accepted.` If not,
say what is missing and run `/verify` again. Only a person can pass this gate.

> **Stuck at minute 40?** `git switch step-4-verified` has a verified build with its `VERIFY.md`.

---

## 5. Publish (minutes 40-50)

You set the project and enabled the services in section 1. Skipped that? Run the section 1 commands
now, then wait 1 minute before you deploy. Check that the CLI still points at your `vtv-...` project:

```sh
gcloud config get-value project
```

Empty or wrong? Run `source ~/.bashrc` (or the section 1 commands again).

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
> Cloud Run errors: `PERMISSION_DENIED` on Artifact Registry right after enabling? Wait 1 minute and
> run the same deploy again (it may take two tries). Otherwise read the last lines of the build log
> first; the usual cause is billing not linked to the project yet: run `gcloud billing projects link` from section 1 again.

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

## Fallback box (no terminal works for you)

If you cannot use Cloud Shell or `agy` (under 18, Google does not know your age, work account, sign-in
fails) and have no laptop set up (Appendix A), or your free quota ran out:

1. Open https://aistudio.google.com/apps (Build > New app). Sign in with any account AI Studio accepts.
2. Paste the contents of `docs/brief.md` into "Describe an app" and send it. Keep "Default mode".
   It takes about 5 minutes.
3. For Gate 3, check the four criteria one by one in the Preview pane. Write what you saw.
   The app keeps its data in your browser; that is fine for the lab.
4. Publishing is optional: Publish > Get started asks for a Google Cloud project with billing.
   Only do it if you claimed the event credit; otherwise stop at the Preview.

Or stay in the terminal: `git switch step-3-build`, then continue from section 4.

---

## Appendix A: install on your own laptop

Use this only if Cloud Shell does not work for you. It needs a personal `@gmail.com` (18 or older,
work and school accounts do not work with Google Antigravity) and a laptop you can install software on.
Do it before the lab if you can: it takes about 20 minutes.

1. Install **git**, **Node.js LTS 22 (22.12+), 24 or 26** (not 23 or 25) and **Python 3**.
2. Install `agy`:
   - macOS or Linux: `curl -fsSL https://antigravity.google/cli/install.sh | bash`
   - macOS with Homebrew: `brew install --cask antigravity-cli`
   - Windows (PowerShell): `irm https://antigravity.google/cli/install.ps1 | iex`

   Check with `agy --version`. Not found? Open a new terminal; on macOS/Linux add `~/.local/bin` to `PATH`.
3. Run `agy` and sign in with your personal `@gmail.com` in the browser (same screens as section 0.3).
4. Install the Google Cloud CLI (https://cloud.google.com/sdk/docs/install) and run
   `gcloud auth login` with the same `@gmail.com`.
5. Clone the starter as in section 0.4, then follow sections 1 to 5 with these differences:
   - Section 1: on a laptop the gcloud setting lasts, so run
     `gcloud config set project "$PROJECT_ID"` instead of the `echo ... >> ~/.bashrc` and `source` lines.
   - Exit codes: `echo $?` on macOS/Linux, `echo $LASTEXITCODE` in PowerShell.
   - Section 3.2: run `npm run dev` and open the address it prints (no Web Preview).
   - Windows: line-ending noise is safe, the lock check ignores CRLF.

## Troubleshooting

| Problem | Try |
|---|---|
| Cloud Shell says you cannot use it (age) | Under 18 or Google does not know your age: use Appendix A or the fallback box |
| Cloud Shell first start is slow | The first start of the day takes 2-3 minutes; wait |
| `agy --version` prints 1.4 | Cloud Shell's old `agy` comes first: `source ~/.bashrc` |
| `agy: command not found` | Cloud Shell: `source ~/.bashrc`. Laptop: new terminal; add `~/.local/bin` to `PATH` |
| Sign-in code does not paste | Click in the terminal, then Ctrl+V (Cmd+V on a Mac); allow clipboard access if the browser asks |
| Sign-in loop | Use the personal `@gmail.com`; option 1, Google OAuth; try a private window |
| Claim page asks for a profile | A Google Developer Program profile is required: click **Create profile**, finish it, then claim |
| No smartphone for the human check | Borrow a neighbour's phone to scan the QR code, or ask a helper; otherwise use the fallback box |
| Credit not visible right after claiming | Normal: it takes 3-5 minutes. Then look for the billing account named `GDP Credit...` |
| `gcloud billing accounts list` is empty | Wait 3-5 minutes after claiming; check Cloud Shell uses the same `@gmail.com` as the claim |
| `gcloud projects create` fails | ID taken or invalid: run the `PROJECT_ID=` line again, then create again. Too many projects: reuse one of yours |
| `gcloud billing projects link` fails | `$BILLING_ACCOUNT` empty (wait, rerun that line) or the account is closed; use the open `GDP Credit` one |
| `gcloud config get-value project` empty in a new tab | `source ~/.bashrc`; if still empty, redo the section 1 commands |
| `npm ci` fails | `node -v` must be an LTS: 22 (22.12+), 24 or 26. Not 23 or 25 |
| `gcloud` asks you to sign in | Cloud Shell: click Authorize. Laptop: `gcloud auth login` with the same `@gmail.com` |
| Web Preview shows nothing | The dev server must run with `--port 8080`, and Web Preview must use port 8080 |
| `PERMISSION_DENIED` on `artifactregistry.repositories.get` right after enabling the services | The services are still switching on: wait 1 minute and run `gcloud run deploy` again (it may take two tries) |
| `git switch step-1-spec` says invalid reference | `git fetch origin` first |
| `core lock` / `check:core` fails | You or the agent changed a locked file: `git checkout -- src/core CORE.lock` |
| You pressed No and the agent stopped | Normal: type what to do instead, then `continue` |
| Agent edits a test to pass | Refuse it. Say: "Do not change tests. Fix `src/ui/`." |
| Agent wants a new package | Refuse it. The rules say no new dependencies |
| Cloud Shell tab disconnected | Open it again, `cd vibe-to-verified-starter`; your files and the project line are kept |
| Quota exhausted | `git switch` to the next checkpoint |
