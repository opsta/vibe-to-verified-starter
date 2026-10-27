import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, increment, setDoc, updateDoc, writeBatch, type Firestore } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-vtv",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

const question = (text: string, uid = "alice", extra: Record<string, unknown> = {}) => ({
  text,
  authorId: uid,
  votes: 0,
  createdAt: Date.now(),
  ...extra,
});

describe("questions create", () => {
  it("unauthenticated user cannot create a question", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), question("hi")));
  });

  it("signed-in user can create a valid question", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertSucceeds(setDoc(doc(db, "questions/q1"), question("hi")));
  });

  it("authorId must equal request.auth.uid", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), question("hi", "bob")));
  });

  it("text must be trimmed and 1..280 code points", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), question("")));
    await assertFails(setDoc(doc(db, "questions/w1"), question("   \n\t ")));
    await assertFails(setDoc(doc(db, "questions/w2"), question(" hi")));
    await assertFails(setDoc(doc(db, "questions/w3"), question("hi ")));
    await assertSucceeds(setDoc(doc(db, "questions/o1"), question("a")));
    await assertSucceeds(setDoc(doc(db, "questions/o2"), question("a b")));
    await assertSucceeds(setDoc(doc(db, "questions/q2"), question("a".repeat(280))));
    await assertFails(setDoc(doc(db, "questions/q3"), question("a".repeat(281))));
    await assertFails(setDoc(doc(db, "questions/q4"), question("😀".repeat(281))));
  });

  it("counts Thai tone marks as code points (280 ok, 281 denied)", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const at280 = "ที่".repeat(93) + "ก";
    expect([...at280]).toHaveLength(280);
    await assertSucceeds(setDoc(doc(db, "questions/th1"), question(at280)));
    await assertFails(setDoc(doc(db, "questions/th2"), question(at280 + "ก")));
  });

  it("accepts 280 Thai characters and 280 emoji (what the client accepts)", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertSucceeds(setDoc(doc(db, "questions/t1"), question("ก".repeat(280))));
    await assertSucceeds(setDoc(doc(db, "questions/e1"), question("😀".repeat(280))));
  });

  it("createdAt must be near server time", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "questions/c1"), question("hi", "alice", { createdAt: -1e15 })));
    await assertFails(setDoc(doc(db, "questions/c2"), question("hi", "alice", { createdAt: 1 })));
    await assertFails(setDoc(doc(db, "questions/c3"), question("hi", "alice", { createdAt: Date.now() + 3600_000 })));
    await assertFails(setDoc(doc(db, "questions/c4"), question("hi", "alice", { createdAt: 4e15 })));
    await assertSucceeds(setDoc(doc(db, "questions/c5"), question("hi", "alice", { createdAt: Date.now() })));
  });

  it("votes must start at 0", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), question("hi", "alice", { votes: 1 })));
  });

  it("rejects extra fields and non-string text", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), question("hi", "alice", { admin: true })));
    await assertFails(setDoc(doc(db, "questions/q2"), question("hi", "alice", { text: 5 })));
  });

  it("anyone can read questions, even signed out", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "questions/q1"), question("hi"));
    });
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "questions/q1")));
  });
});

describe("questions update and delete", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "questions/q1"), question("hi"));
    });
  });

  it("cannot edit the text or delete", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), question("changed")));
    await assertFails(setDoc(doc(db, "questions/q1"), { text: "x" }, { merge: true }));
  });

  it("vote doc plus votes+1 in one batch succeeds", async () => {
    const db = env.authenticatedContext("bob").firestore();
    const b = writeBatch(db);
    b.set(doc(db, "questions/q1/votes/bob"), {});
    b.update(doc(db, "questions/q1"), { votes: increment(1) });
    await assertSucceeds(b.commit());
  });

  it("question cannot be deleted", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(deleteDoc(doc(db, "questions/q1")));
  });

  it("votes cannot be decremented", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "questions/q1"), { votes: 3 }, { merge: true });
    });
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(updateDoc(doc(db, "questions/q1"), { votes: increment(-1) }));
  });

  it("authorId and createdAt cannot change on update", async () => {
    const db = env.authenticatedContext("bob").firestore();
    for (const patch of [{ authorId: "bob" }, { createdAt: 5 }]) {
      const b = writeBatch(db);
      b.set(doc(db, "questions/q1/votes/bob"), {});
      b.update(doc(db, "questions/q1"), { votes: increment(1), ...patch });
      await assertFails(b.commit());
    }
  });

  it("two +1 increments in one batch are rejected", async () => {
    const db = env.authenticatedContext("bob").firestore();
    const b = writeBatch(db);
    b.set(doc(db, "questions/q1/votes/bob"), {});
    b.update(doc(db, "questions/q1"), { votes: increment(1) });
    b.update(doc(db, "questions/q1"), { votes: increment(1) });
    await assertFails(b.commit());
  });

  it("votes cannot be bumped without a vote doc", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertFails(setDoc(doc(db, "questions/q1"), { votes: 1 }, { merge: true }));
  });

  it("votes cannot jump by more than 1", async () => {
    const db = env.authenticatedContext("bob").firestore();
    const b = writeBatch(db);
    b.set(doc(db, "questions/q1/votes/bob"), {});
    b.update(doc(db, "questions/q1"), { votes: increment(5) });
    await assertFails(b.commit());
  });
});

describe("votes", () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "questions/q1"), question("hi"));
    });
  });

  const vote = (db: Firestore, voteUid: string, body: Record<string, unknown> = {}) => {
    const b = writeBatch(db);
    b.set(doc(db, `questions/q1/votes/${voteUid}`), body);
    b.update(doc(db, "questions/q1"), { votes: increment(1) });
    return b.commit();
  };

  it("unauthenticated cannot vote", async () => {
    await assertFails(vote(env.unauthenticatedContext().firestore(), "bob"));
  });

  it("vote doc id must equal uid", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertFails(vote(db, "carol"));
    await assertSucceeds(vote(db, "bob"));
  });

  it("vote doc must be empty", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertFails(vote(db, "bob", { extra: 1 }));
  });

  it("vote doc without the votes+1 update is rejected", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertFails(setDoc(doc(db, "questions/q1/votes/bob"), {}));
  });

  it("cannot write a second vote doc", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertSucceeds(vote(db, "bob"));
    await assertFails(vote(db, "bob"));
    await assertFails(setDoc(doc(db, "questions/q1/votes/bob"), {}));
  });

  it("vote doc cannot be updated, deleted or read by another user", async () => {
    const bob = env.authenticatedContext("bob").firestore();
    await assertSucceeds(vote(bob, "bob"));
    await assertFails(updateDoc(doc(bob, "questions/q1/votes/bob"), { x: 1 }));
    await assertFails(deleteDoc(doc(bob, "questions/q1/votes/bob")));
    await assertSucceeds(getDoc(doc(bob, "questions/q1/votes/bob")));
    const carol = env.authenticatedContext("carol").firestore();
    await assertFails(getDoc(doc(carol, "questions/q1/votes/bob")));
  });

  it("cannot vote on a missing question", async () => {
    const db = env.authenticatedContext("bob").firestore();
    await assertFails(setDoc(doc(db, "questions/nope/votes/bob"), {}));
  });
});

describe("default deny", () => {
  it("any other collection is denied", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "other/x"), { a: 1 }));
    await assertFails(getDoc(doc(db, "other/x")));
  });
});
