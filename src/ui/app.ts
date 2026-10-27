import type { QuestionStore } from "../core/store";

/** Minimal stub: renders the question list. Replace with the real UI. */
export function mountApp(root: HTMLElement, store: QuestionStore, userId: string | null): void {
  void userId; // null = signed out: read only, no ask or upvote
  root.textContent = "";
  const list = document.createElement("ul");
  root.appendChild(list);
  void store.list().then((questions) => {
    for (const q of questions) {
      const li = document.createElement("li");
      li.textContent = `${q.text} (${q.votes})`;
      list.appendChild(li);
    }
  });
}
