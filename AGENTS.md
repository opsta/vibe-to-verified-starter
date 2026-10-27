# DevFest Q&A board

Web app. Attendees see questions sorted by votes, sign in to ask, upvote once.

## Rules
- `src/core/` is read-only. So is every file listed in `CORE.lock`.
- Never run `node scripts/check-core.mjs --write`. Never edit `CORE.lock`.
- Write app code only in `src/ui/`.
- Write tests only in `src/ui/**/*.test.ts`.
- Never edit or delete a test to make it pass. If a test looks wrong, stop and ask the human.
- Never skip, weaken or delete a test; Gate 3 will show every test change.
- Do not add dependencies.

## How to build
- Use the `QuestionStore` interface from `src/core/store.ts`. Read it first.
- In tests, use `createMemoryStore()` from `src/core/memory-store.ts`. No network.
- Question text is 1-280 code points. The store enforces it. Show its errors in the UI.
- One vote per user per question. The store throws `DuplicateVoteError`.

## Check your work
Contract: npm run verify:contract

Run it before you say you are done. It must exit 0.

## Gates
Stop and wait for the human at each gate:
- Gate 1 spec approved
- Gate 2 plan approved
- Gate 3 VERIFY.md accepted
