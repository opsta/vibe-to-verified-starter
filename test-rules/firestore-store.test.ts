import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { beforeAll, describe, expect, it } from "vitest";
import { createFirestoreStore } from "../src/core/firestore-store";
import { DuplicateVoteError, ValidationError } from "../src/core/types";

// Runs the adapter against the emulators with the real rules deployed.
let uid = "";
let store: ReturnType<typeof createFirestoreStore>;

beforeAll(async () => {
  const app = initializeApp({ projectId: "demo-vtv", apiKey: "demo-key" });
  connectFirestoreEmulator(getFirestore(app), "127.0.0.1", 8080);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  uid = (await signInAnonymously(auth)).user.uid;
  store = createFirestoreStore(app);
});

describe("firestore store (same contract as memory store)", () => {
  it("ask rejects empty/whitespace and over-long text", async () => {
    await expect(store.ask("  \n ", uid)).rejects.toBeInstanceOf(ValidationError);
    await expect(store.ask("ก".repeat(281), uid)).rejects.toBeInstanceOf(ValidationError);
  });

  it("accepts 280 Thai chars and 280 emoji", async () => {
    await expect(store.ask("ก".repeat(280), uid)).resolves.toBeDefined();
    await expect(store.ask("😀".repeat(280), uid)).resolves.toBeDefined();
  });

  it("trims text, starts at zero votes, lists sorted", async () => {
    const a = await store.ask("  first  ", uid);
    expect(a.text).toBe("first");
    expect(a.votes).toBe(0);
    expect(a.authorId).toBe(uid);
    const voted = await store.upvote(a.id, uid);
    expect(voted.votes).toBe(1);
    const list = await store.list();
    expect(list[0]?.id).toBe(a.id);
  });

  it("second upvote by same user throws DuplicateVoteError", async () => {
    const q = await store.ask("dup", uid);
    await store.upvote(q.id, uid);
    await expect(store.upvote(q.id, uid)).rejects.toBeInstanceOf(DuplicateVoteError);
  });

  it("concurrent double upvote counts once", async () => {
    const q = await store.ask("race", uid);
    const r = await Promise.allSettled([store.upvote(q.id, uid), store.upvote(q.id, uid)]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    const found = (await store.list()).find((x) => x.id === q.id);
    expect(found?.votes).toBe(1);
  });

  it("upvote unknown id throws ValidationError", async () => {
    await expect(store.upvote("nope", uid)).rejects.toBeInstanceOf(ValidationError);
  });
});
