export type Question = {
  id: string;
  text: string;
  authorId: string;
  votes: number;
  createdAt: number;
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DuplicateVoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateVoteError";
  }
}
