import type { Question } from "./types";

export interface QuestionStore {
  /** Sorted by votes descending, then createdAt ascending. */
  list(): Promise<Question[]>;
  /** Trims the text; 1..280 characters counted as [...text].length. */
  ask(text: string, authorId: string): Promise<Question>;
  /** One vote per user per question. */
  upvote(id: string, userId: string): Promise<Question>;
}
