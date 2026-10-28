# Implementation Plan: DevFest Q&A Board (`qa_board_20261028`)

## Phase 1: Q&A Board UI & Acceptance Tests

- [ ] Task: Question List Rendering & Signed-Out Read-Only Mode (Criteria 1 & 4)
    - [ ] Write failing tests in `src/ui/app.test.ts` using `createMemoryStore()` verifying that questions are listed sorted by votes descending (showing text and vote count) and that signed-out users (`userId === null`) can read the list without ask or upvote controls
    - [ ] Implement question list rendering and signed-out read-only mode in `src/ui/app.ts`
    - [ ] Verify tests pass and `npm run verify:contract` succeeds

- [ ] Task: Ask Question Form & Validation Error Handling (Criterion 2)
    - [ ] Add failing tests in `src/ui/app.test.ts` verifying that a signed-in user can submit a valid question (1–280 code points) which appears in the list, and that an empty or >280 code point question displays the store's `ValidationError` message
    - [ ] Implement the ask question form, submission handler, list refresh, and error message display (`role="alert"`) in `src/ui/app.ts`
    - [ ] Verify tests pass and `npm run verify:contract` succeeds

- [ ] Task: Upvote Question & Duplicate Vote Rejection (Criterion 3)
    - [ ] Add failing tests in `src/ui/app.test.ts` verifying that a signed-in user can upvote a question once (updating its vote count and sort order) and that a second upvote by the same user on the same question is rejected with the count unchanged and error message shown
    - [ ] Implement the upvote button handler, list re-render, and `DuplicateVoteError` display in `src/ui/app.ts`
    - [ ] Verify tests pass and `npm run verify:contract` succeeds

- [ ] Task: Phase Verification & Checkpoint (Refer to workflow.md)
    - [ ] Run `npm run verify:contract` and confirm all unit tests, type checks, and core/test guards pass with exit code 0
