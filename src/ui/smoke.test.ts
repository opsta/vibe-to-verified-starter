import { beforeEach, expect, it } from "vitest";

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

it("main mounts and renders seed questions with memory store", async () => {
  const { boot } = await import("../main");
  await boot(document.getElementById("app") as HTMLElement, {});
  const items = document.querySelectorAll("#app li");
  expect(items.length).toBe(3);
  expect(document.getElementById("app")?.textContent).toContain("What is verified vibe coding?");
});
