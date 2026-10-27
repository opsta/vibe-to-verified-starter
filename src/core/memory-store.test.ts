import { describe, expect, it } from "vitest";
import { createMemoryStore } from "./memory-store";
import { DuplicateVoteError, ValidationError } from "./types";

describe("memory store", () => {
  it("ask rejects empty/whitespace", async () => {
    const store = createMemoryStore();
    await expect(store.ask("", "u1")).rejects.toBeInstanceOf(ValidationError);
    await expect(store.ask("  \n\t ", "u1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("accepts 280 Thai code points, rejects 281", async () => {
    const store = createMemoryStore();
    const ok = await store.ask("ก".repeat(280), "u1");
    expect(ok.text).toHaveLength(280);
    await expect(store.ask("ก".repeat(281), "u1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("counts each emoji as one code point", async () => {
    const store = createMemoryStore();
    await expect(store.ask("😀".repeat(280), "u1")).resolves.toBeDefined();
    await expect(store.ask("😀".repeat(281), "u1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("counts Thai tone marks as separate code points", async () => {
    const store = createMemoryStore();
    // "ที่" is 3 code points (ท, ี, ่); 93 repeats = 279, plus one more = 280.
    const at280 = "ที่".repeat(93) + "ก";
    expect([...at280]).toHaveLength(280);
    await expect(store.ask(at280, "u1")).resolves.toBeDefined();
    await expect(store.ask(at280 + "ก", "u1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("trims text and starts at zero votes", async () => {
    const store = createMemoryStore();
    const q = await store.ask("  hello  ", "u1");
    expect(q.text).toBe("hello");
    expect(q.votes).toBe(0);
    expect(q.authorId).toBe("u1");
  });

  it("list sorts by votes then age", async () => {
    const store = createMemoryStore([
      { id: "a", text: "old", authorId: "u", votes: 1, createdAt: 1 },
      { id: "b", text: "new", authorId: "u", votes: 1, createdAt: 2 },
      { id: "c", text: "top", authorId: "u", votes: 5, createdAt: 3 },
    ]);
    const ids = (await store.list()).map((q) => q.id);
    expect(ids).toEqual(["c", "a", "b"]);
  });

  it("upvote increments votes", async () => {
    const store = createMemoryStore();
    const q = await store.ask("hi", "u1");
    const voted = await store.upvote(q.id, "u2");
    expect(voted.votes).toBe(1);
  });

  it("second upvote by same user throws DuplicateVoteError", async () => {
    const store = createMemoryStore();
    const q = await store.ask("hi", "u1");
    await store.upvote(q.id, "u2");
    await expect(store.upvote(q.id, "u2")).rejects.toBeInstanceOf(DuplicateVoteError);
    expect((await store.list())[0]?.votes).toBe(1);
  });

  it("concurrent double upvote counts once", async () => {
    const store = createMemoryStore();
    const q = await store.ask("hi", "u1");
    const results = await Promise.allSettled([store.upvote(q.id, "u2"), store.upvote(q.id, "u2")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await store.list())[0]?.votes).toBe(1);
  });

  it("upvote unknown id throws ValidationError", async () => {
    const store = createMemoryStore();
    await expect(store.upvote("nope", "u1")).rejects.toBeInstanceOf(ValidationError);
  });
});
