import { beforeEach, expect, it } from "vitest";

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

it("main mounts and renders seed questions with memory store", async () => {
  const { boot } = await import("../main");
  const root = document.getElementById("app") as HTMLElement;
  await boot(root, {}); // empty env forces the memory store
  const text = root.textContent ?? "";
  expect(text).toContain("What is verified vibe coding?");
  expect(text).toContain("How do I upvote a question?");
  expect(text).toContain("Can I ask in Thai?");
});
