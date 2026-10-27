// Infrastructure: wires the store and the user. The UI lives in src/ui/.
import { createMemoryStore } from "./core/memory-store";
import type { QuestionStore } from "./core/store";
import { mountApp } from "./ui/app";

type Env = Record<string, string | undefined>;

const DEMO_USER = "demo-user";
const SEED = ["What is verified vibe coding?", "How do I upvote a question?", "Can I ask in Thai?"];

async function connect(env: Env): Promise<{ store: QuestionStore; userId: string }> {
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    const { initializeApp } = await import("firebase/app");
    const { getAuth, signInAnonymously } = await import("firebase/auth");
    const { createFirestoreStore } = await import("./core/firestore-store");
    const app = initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    });
    const cred = await signInAnonymously(getAuth(app));
    return { store: createFirestoreStore(app), userId: cred.user.uid };
  }
  const now = Date.now();
  const seed = SEED.map((text, i) => ({
    id: `seed-${i + 1}`,
    text,
    authorId: "seed",
    votes: 3 - i,
    createdAt: now - (SEED.length - i) * 1000,
  }));
  return { store: createMemoryStore(seed), userId: DEMO_USER };
}

export async function boot(root: HTMLElement, env: Env): Promise<void> {
  const { store, userId } = await connect(env);
  mountApp(root, store, userId);
  await store.list(); // let the first render settle
}

const root = typeof document === "undefined" ? null : document.getElementById("app");
if (root) {
  const env = (import.meta as unknown as { env: Env }).env;
  void boot(root, env);
}
