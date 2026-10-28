# Project Workflow

## Guiding Principles

1.  **The Plan is the Source of Truth:** All work must be tracked in `plan.md`
2.  **The Tech Stack is Deliberate:** Changes to the tech stack must be
    documented in `tech-stack.md` *before* implementation
3.  **Test-Driven Development:** Write unit tests before implementing
    functionality
4.  **Contract Verification:** Code coverage target is 0% (enforced instead via
    the project contract command `npm run verify:contract`)
5.  **User Experience First:** Every decision should prioritize user experience
6.  **Non-Interactive & CI-Aware:** Prefer non-interactive commands. Use
    `CI=true` for watch-mode tools (tests, linters) to ensure single execution.

## Task Workflow

All tasks follow a strict lifecycle:

### Standard Task Workflow

1.  **Select Task:** Choose the next available task from `plan.md` in sequential
    order

2.  **Mark In Progress:** Before beginning work, edit `plan.md` and change the
    task from `[ ]` to `[~]`

3.  **Write Failing Tests (Red Phase):**

    -   Create or update a test file in `src/ui/**/*.test.ts` for the feature or bug fix (never edit or delete existing tests to make them pass).
    -   Write one or more unit tests that clearly define the expected behavior
        and acceptance criteria for the task using `createMemoryStore()`.
    -   **CRITICAL:** Run the tests and confirm that they fail as expected. This
        is the "Red" phase of TDD. Do not proceed until you have failing tests.

4.  **Implement to Pass Tests (Green Phase):**

    -   Write the minimum amount of application code in `src/ui/` necessary to make the
        failing tests pass.
    -   Run the test suite again (`npm test`) and confirm that all tests now pass. This is
        the "Green" phase.

5.  **Refactor (Optional but Recommended):**

    -   With the safety of passing tests, refactor the implementation code in `src/ui/`
        to improve clarity, remove duplication, and enhance
        performance without changing the external behavior.
    -   Rerun tests to ensure they still pass after refactoring.

6.  **Verify Contract:** Run `npm run verify:contract` (coverage percentage target: 0%). Confirm it exits with code 0.

7.  **Document Deviations:** If implementation differs from tech stack:

    -   **STOP** implementation
    -   Update `tech-stack.md` with new design
    -   Add dated note explaining the change
    -   Resume implementation

8.  **Commit Code Changes (After Each Task):**

    -   Stage all code changes related to the task.
    -   Propose a clear, concise commit message e.g., `feat(ui): Create basic
        HTML structure for question board`.
    -   Perform the commit.

9.  **Attach Task Summary with Git Notes:**

    -   **Step 9.1: Get Commit Hash:** Obtain the hash of the *just-completed
        commit* (`git log -1 --format="%H"`).
    -   **Step 9.2: Draft Note Content:** Create a detailed summary for the
        completed task. This should include the task name, a summary of changes,
        a list of all created/modified files, and the core "why" for the change.
    -   **Step 9.3: Attach Note:** Use the `git notes` command to attach the
        summary to the commit:
        `git notes add -m "<note content>" <commit_hash>`

10. **Get and Record Task Commit SHA:**

    -   **Step 10.1: Update Plan:** Read `plan.md`, find the line for the
        completed task, update its status from `[~]` to `[x]`, and append the
        first 7 characters of the *just-completed commit's* commit hash.
    -   **Step 10.2: Write Plan:** Write the updated content back to `plan.md`.

11. **Commit Plan Update:**

    -   **Action:** Stage the modified `plan.md` file.
    -   **Action:** Commit this change with a descriptive message (e.g.,
        `conductor(plan): Mark task 'Render sorted question list' as complete`).

### Task Correction & Plan Amendment Workflows

When an implemented task or phase requires corrections, amendments, or additions, follow these standard workflows to maintain plan integrity and avoid untracked code drift:

1.  **In-Flight Refinements:** If minor gaps are found while a task is actively
    in-progress (`[~]`), make the adjustments directly in the active
    implementation stream and ensure passing tests before committing.
2.  **Code Review Corrections (`conductor-review`):** If issues are identified
    during or after a code review, instruct the agent to review your changes.
    The review agent will automatically append a `Review Fixes` phase
    to `plan.md` so that correction tasks are formally tracked and
    checkpointed.
3.  **Logical State Reversions (`conductor-revert`):** If a task implementation
    is fundamentally flawed or needs to be redone, instruct the agent to revert
    the changes. This safely rolls back associated git
    commits and resets the task state in `plan.md` back to pending `[ ]` to
    allow a clean restart.

### Phase Completion Verification and Checkpointing Protocol

**Trigger:** This protocol is executed immediately after a task is completed
that also concludes a phase in `plan.md`.

1.  **Announce Protocol Start:** Inform the user that the phase is complete and
    the verification and checkpointing protocol has begun.

2.  **Ensure Test Coverage for Phase Changes:**

    -   **Step 2.1: Determine Phase Scope:** Read `plan.md` to
        find the Git commit SHA of the *previous* phase's checkpoint. If no
        previous checkpoint exists, the scope is all changes since the first
        commit.
    -   **Step 2.2: List Changed Files:** Execute `git diff --name-only
        <previous_checkpoint_sha> HEAD` to get a precise list of all files
        modified during this phase.
    -   **Step 2.3: Verify and Create Tests:** For each code file in `src/ui/`,
        verify a corresponding test file in `src/ui/**/*.test.ts` exists.

3.  **Execute Automated Tests with Proactive Debugging:**

    -   Before execution, announce the exact shell command you will
        use to run the tests (`npm run verify:contract`).
    -   Execute the announced command.
    -   If checks fail, inform the user and begin debugging (up to two attempts).

4.  **Propose a Detailed, Actionable Manual Verification Plan:**

    -   Generate a step-by-step plan that walks the user through
        the verification process (`npm run dev`, browser URL, expected outcomes).

5.  **Await Explicit User Feedback:**

    -   Ask the user for confirmation and **PAUSE** for their response.

6.  **Identify Target Commit for Report:**

    -   Do NOT create a new empty commit for checkpointing.
    -   Identify the hash of the last functional commit made during this phase.

7.  **Attach Auditable Verification Report using Git Notes:**

    -   Attach the verification report to the target commit using `git notes`.

8.  **Get and Record Phase Checkpoint SHA:**

    -   Append `[checkpoint: <sha>]` to the completed phase heading in `plan.md`.

9.  **Commit Plan Update:**

    -   Stage and commit `plan.md` with `conductor(plan): Mark phase '<PHASE NAME>' as complete`.

10. **Announce Completion:** Inform the user that the phase is complete and the
    checkpoint has been created, with the detailed verification report attached
    as a git note.

### Quality Gates

Before marking any task complete, verify:

-   [ ] All tests pass (`npm test`)
-   [ ] Contract verification passes (`npm run verify:contract`, 0% coverage threshold)
-   [ ] Code follows project's code style guidelines (as defined in
    `code_styleguides/`)
-   [ ] Type safety is enforced (`tsc --noEmit`)
-   [ ] `CORE.lock` and `src/core/` remain untouched
-   [ ] No existing tests were edited, weakened, or deleted

## Development Commands

### Setup

```bash
npm install
```

### Daily Development

```bash
npm run dev
npm test
```

### Before Committing

```bash
npm run verify:contract
```

## Testing Requirements

### Unit & UI Testing

-   Write tests only in `src/ui/**/*.test.ts`.
-   Use `createMemoryStore()` from `src/core/memory-store.ts` (no network).
-   Test both signed-in (`userId` present) and signed-out (`userId === null`) states.
-   Test both success and failure cases (`ValidationError`, `DuplicateVoteError`).
-   Never edit, skip, weaken, or delete an existing test to make it pass.

## Commit Guidelines

### Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

-   `feat`: New feature
-   `fix`: Bug fix
-   `docs`: Documentation only
-   `style`: Formatting, missing semicolons, etc.
-   `refactor`: Code change that neither fixes a bug nor adds a feature
-   `test`: Adding missing tests
-   `chore`: Maintenance tasks
-   `conductor`: Conductor planning and setup updates

## Definition of Done

A task is complete when:

1.  All code implemented to specification in `src/ui/`
2.  Unit tests written and passing in `src/ui/**/*.test.ts`
3.  `npm run verify:contract` exits 0
4.  Implementation status updated in `plan.md`
5.  Changes committed with proper message after each task
6.  Git note with task summary attached to the commit
7.  Verification gates (Gate 1, Gate 2, Gate 3) respected
