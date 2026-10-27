import type { QuestionStore } from "./store";
import { DuplicateVoteError, ValidationError, type Question } from "./types";

const MAX_LENGTH = 280;

export function createMemoryStore(seed: Question[] = []): QuestionStore {
  const questions = new Map<string, Question>(seed.map((q) => [q.id, { ...q }]));
  const voters = new Map<string, Set<string>>();
  let counter = 0;

  return {
    async list() {
      return [...questions.values()]
        .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt)
        .map((q) => ({ ...q }));
    },

    async ask(text, authorId) {
      const trimmed = text.trim();
      const length = [...trimmed].length;
      if (length < 1 || length > MAX_LENGTH) {
        throw new ValidationError(`Question must be 1 to ${MAX_LENGTH} characters`);
      }
      counter += 1;
      const question: Question = {
        id: `q${counter}-${Date.now().toString(36)}`,
        text: trimmed,
        authorId,
        votes: 0,
        createdAt: Date.now(),
      };
      questions.set(question.id, question);
      return { ...question };
    },

    async upvote(id, userId) {
      const question = questions.get(id);
      if (!question) throw new ValidationError(`Unknown question: ${id}`);
      const seen = voters.get(id) ?? new Set<string>();
      if (seen.has(userId)) throw new DuplicateVoteError("Already voted on this question");
      seen.add(userId);
      voters.set(id, seen);
      question.votes += 1;
      return { ...question };
    },
  };
}
