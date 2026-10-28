# Product Guidelines: DevFest Q&A Board

## Voice & Tone

- **Clear & Concise:** UI labels, placeholders, and error messages should be direct, accessible, and easy to scan during a live conference session.
- **Helpful Feedback:** When validation or duplicate-vote errors occur from `QuestionStore`, surface the store's error message clearly so attendees immediately understand why an action was rejected.

## UX Principles

1. **Immediate Clarity:** The question list is the primary view, always sorted by votes descending so top audience questions stand out.
2. **Role-Aware Interface:**
   - **Signed-In (`userId` present):** Show the question submission form and upvote buttons on each question row.
   - **Signed-Out (`userId === null`):** Present a clean read-only view of the question list without ask or upvote controls.
3. **Semantic & Testable DOM:** Use semantic HTML elements (`<form>`, `<input>`/`<textarea>`, `<button>`, `<ul>`/`<li>`, `role="alert"` or clear error containers) so both users and automated DOM tests can reliably interact with the board.
4. **Zero-Dependency Simplicity:** Built with clean, standard DOM APIs in TypeScript without external UI frameworks or extra runtime dependencies.
