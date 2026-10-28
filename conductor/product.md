# Product Definition: DevFest Q&A Board

## Overview

DevFest Q&A Board is a web application designed for DevFest attendees to view, submit, and upvote session questions in real time. Attendees can see all submitted questions sorted by vote count (highest votes first, then earliest created), sign in to ask new questions, and upvote existing questions once per user.

## Core Features & Acceptance Criteria

1. **Question List Display (`[ui]`):**
   - Lists all questions sorted with the most votes first (ties broken by creation time ascending).
   - Each row displays the question text and its current vote count.
2. **Ask a Question (`[ui]`):**
   - Signed-in users (`userId !== null`) can type a question (1–280 Unicode code points, trimmed) and submit it.
   - Upon submission, the question appears in the list.
   - Empty or overly long questions (>280 code points) are rejected by the store with a `ValidationError`, and the error message is displayed in the UI.
3. **Upvote a Question:**
   - Signed-in users can upvote a question once.
   - A second upvote by the same user on the same question is rejected with a `DuplicateVoteError`, and the vote count does not change (any error message is shown in the UI).
4. **Read-Only Mode for Signed-Out Users:**
   - Users who are not signed in (`userId === null`) can read the question list, but ask and upvote controls are hidden/unavailable.

## Architecture & Constraints

- **UI Boundary:** Application UI code lives exclusively in `src/ui/` (entry point `mountApp(root, store, userId)` in `src/ui/app.ts`) and tests in `src/ui/**/*.test.ts`.
- **Locked Core:** `src/core/` and all files in `CORE.lock` are read-only infrastructure providing `QuestionStore`, `createMemoryStore`, and `createFirestoreStore`.
