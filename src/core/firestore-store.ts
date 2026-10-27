import type { FirebaseApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  increment,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import type { QuestionStore } from "./store";
import { DuplicateVoteError, ValidationError, type Question } from "./types";

// Counts Unicode code points, same as the memory store. The rules cap at 560
// UTF-16 units (size() counts units), which is the worst case for 280.
const MAX_LENGTH = 280;

type QuestionDoc = { text: string; authorId: string; votes: number; createdAt: number };

export function createFirestoreStore(app: FirebaseApp): QuestionStore {
  const db = getFirestore(app);
  const questions = collection(db, "questions");

  const toQuestion = (id: string, d: QuestionDoc): Question => ({
    id,
    text: d.text,
    authorId: d.authorId,
    votes: d.votes,
    createdAt: d.createdAt,
  });

  return {
    async list() {
      const snap = await getDocs(questions);
      return snap.docs
        .map((s) => toQuestion(s.id, s.data() as QuestionDoc))
        .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);
    },

    async ask(text, authorId) {
      const trimmed = text.trim();
      const length = [...trimmed].length;
      if (length < 1 || length > MAX_LENGTH) {
        throw new ValidationError(`Question must be 1 to ${MAX_LENGTH} code points`);
      }
      const ref = doc(questions);
      const data: QuestionDoc = { text: trimmed, authorId, votes: 0, createdAt: Date.now() };
      await setDoc(ref, data);
      return toQuestion(ref.id, data);
    },

    async upvote(id, userId) {
      const qRef = doc(questions, id);
      const vRef = doc(db, "questions", id, "votes", userId);
      return runTransaction(db, async (tx) => {
        const q = await tx.get(qRef);
        if (!q.exists()) throw new ValidationError(`Unknown question: ${id}`);
        const v = await tx.get(vRef);
        if (v.exists()) throw new DuplicateVoteError("Already voted on this question");
        tx.set(vRef, {});
        tx.update(qRef, { votes: increment(1) });
        const d = q.data() as QuestionDoc;
        return toQuestion(id, { ...d, votes: d.votes + 1 });
      });
    },
  };
}
