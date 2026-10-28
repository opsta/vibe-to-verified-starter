# Specification: DevFest Q&A Board (`qa_board_20261028`)

## Overview

Build the DevFest Q&A Board UI in [`src/ui/app.ts`](../../../src/ui/app.ts) using only the [`QuestionStore`](../../../src/core/store.ts) interface. Attendees can view questions sorted by votes, sign in to ask new questions (1–280 Unicode code points), and upvote existing questions once per user. Signed-out users (`userId === null`) have a read-only view of the question list without ask or upvote controls.

## Functional Requirements

1. **Mount Entry Point (`mountApp`):**
   - Implement `mountApp(root: HTMLElement, store: QuestionStore, userId: string | null): void` in `src/ui/app.ts`.
   - Clear `root` and render semantic DOM elements using standard DOM APIs without external dependencies.

2. **Question List Display:**
   - Fetch questions via `store.list()`, which returns questions sorted by `votes` descending and `createdAt` ascending.
   - Render each question in a list item (`<li>`) showing both the question `text` and its `votes` count.

3. **Asking a Question (Signed-In Only, `userId !== null`):**
   - Render a `<form>` containing a text input/textarea and a submit `<button>`.
   - On submission, call `store.ask(text, userId)`.
   - When `store.ask` resolves: clear the input field, clear any displayed error message, and refresh the rendered question list so the new question appears in sorted order.
   - When `store.ask` rejects (e.g., `ValidationError` for empty or >280 code points): display the error message from the rejected error in a dedicated error container (`role="alert"`).

4. **Upvoting a Question (Signed-In Only, `userId !== null`):**
   - Render an upvote `<button>` on each question row when `userId !== null`.
   - When clicked, call `store.upvote(question.id, userId)`.
   - When `store.upvote` resolves: clear any displayed error message and refresh the question list so updated vote counts and sort order are reflected.
   - When `store.upvote` rejects (e.g., `DuplicateVoteError` on a second upvote by the same user): keep the vote count unchanged and display the error message in the error container (`role="alert"`).

5. **Signed-Out Read-Only Mode (`userId === null`):**
   - Render the question list (`store.list()`), showing question text and vote count for each item.
   - Do not render the ask form or upvote buttons.

## Non-Functional Requirements & Constraints

- **UI Boundary:** All application code must reside in `src/ui/` and all tests in `src/ui/**/*.test.ts`.
- **Read-Only Core:** Do not modify `src/core/` or any file in `CORE.lock`.
- **Zero New Dependencies:** Do not modify `package.json` or install extra packages.
- **In-Memory Testing:** Unit and integration tests in `src/ui/**/*.test.ts` must use `createMemoryStore()` from `src/core/memory-store.ts` with no network calls.

## Acceptance criteria

1. [ui] The page lists all questions with the most votes first. Each row shows the question text and its vote count.
2. [ui] A signed-in user can type a question (1-280 code points) and submit it. It appears in the list. An empty or too long question shows an error message.
3. A user can upvote a question once. A second upvote by the same user on the same question is rejected and the count does not change.
4. A user who is not signed in can read the list but cannot ask or upvote.

## Out of Scope

- Authentication UI or sign-in/sign-out flows (`userId` is passed directly into `mountApp`).
- Modifying `src/core/` or Firestore security rules.
- Deleting or editing submitted questions.
