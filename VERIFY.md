# VERIFY

Spec: conductor/tracks/qa_board_20261028/spec.md
Contract: npm run verify:contract (exit 0)

| # | Acceptance criterion | Evidence kind | Evidence | Result |
|---|---|---|---|---|
| 1 | [ui] The page lists all questions with the most votes first. Each row shows the question text and its vote count. | test | DevFest Q&A board UI > lists all questions sorted with the most votes first and shows text and vote count (Criterion 1) (pass) | pass |
| 2 | [ui] A signed-in user can type a question (1-280 code points) and submit it. It appears in the list. An empty or too long question shows an error message. | test | DevFest Q&A board UI > allows a signed-in user to submit a 1-280 code point question and shows errors on empty or too long input (Criterion 2) (pass) | pass |
| 3 | A user can upvote a question once. A second upvote by the same user on the same question is rejected and the count does not change. | test | DevFest Q&A board UI > allows a signed-in user to upvote once and rejects a second upvote by the same user without changing the count (Criterion 3) (pass) | pass |
| 4 | A user who is not signed in can read the list but cannot ask or upvote. | test | DevFest Q&A board UI > allows a signed-out user to read the list but hides ask and upvote controls (Criterion 4) (pass) | pass |

## Untested criteria

none

## Tests modified

src/ui/app.test.ts

## Core files touched

none

Gate 3: awaiting human acceptance
