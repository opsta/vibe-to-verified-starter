# DevFest Q&A board

DevFest Q&A board: attendees see questions sorted by votes, sign in to ask, upvote once.

## Acceptance criteria

1. [ui] The page lists all questions with the most votes first. Each row shows the question text and its vote count.
2. [ui] A signed-in user can type a question (1-280 code points) and submit it. It appears in the list. An empty or too long question shows an error message.
3. A user can upvote a question once. A second upvote by the same user on the same question is rejected and the count does not change.
4. A user who is not signed in can read the list but cannot ask or upvote.
