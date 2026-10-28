import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStore } from '../core/memory-store';
import type { Question } from '../core/types';
import { mountApp } from './app';

function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('DevFest Q&A board UI', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    const el = document.getElementById('app');
    if (!el) {
      throw new Error('Missing #app root element');
    }
    root = el;
  });

  it('lists all questions sorted with the most votes first and shows text and vote count (Criterion 1)', async () => {
    const seed: Question[] = [
      { id: 'q1', text: 'Lower voted question', authorId: 'u1', votes: 2, createdAt: 1000 },
      { id: 'q2', text: 'Top voted question', authorId: 'u2', votes: 10, createdAt: 2000 },
      { id: 'q3', text: 'Middle voted question', authorId: 'u3', votes: 5, createdAt: 1500 },
    ];
    const store = createMemoryStore(seed);
    mountApp(root, store, 'user-1');
    await flushPromises();

    const items = Array.from(root.querySelectorAll('li'));
    expect(items.length).toBe(3);

    const firstText = items[0]?.querySelector('.qa-text')?.textContent;
    const firstVotes = items[0]?.querySelector('.qa-votes')?.textContent;
    expect(firstText).toBe('Top voted question');
    expect(firstVotes).toBe('10');

    const secondText = items[1]?.querySelector('.qa-text')?.textContent;
    const secondVotes = items[1]?.querySelector('.qa-votes')?.textContent;
    expect(secondText).toBe('Middle voted question');
    expect(secondVotes).toBe('5');

    const thirdText = items[2]?.querySelector('.qa-text')?.textContent;
    const thirdVotes = items[2]?.querySelector('.qa-votes')?.textContent;
    expect(thirdText).toBe('Lower voted question');
    expect(thirdVotes).toBe('2');
  });

  it('allows a signed-in user to submit a 1-280 code point question and shows errors on empty or too long input (Criterion 2)', async () => {
    const store = createMemoryStore();
    mountApp(root, store, 'user-1');
    await flushPromises();

    const form = root.querySelector('form');
    const input = root.querySelector('input');
    const alertBox = root.querySelector('[role="alert"]');
    expect(form).not.toBeNull();
    expect(input).not.toBeNull();
    expect(alertBox).not.toBeNull();
    if (!form || !input || !alertBox) return;

    // Empty submission shows validation error
    input.value = '   ';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(alertBox.textContent).toContain('1 to 280 code points');
    expect(root.querySelectorAll('li').length).toBe(0);

    // Too long submission (>280 code points) shows validation error
    input.value = 'a'.repeat(281);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(alertBox.textContent).toContain('1 to 280 code points');
    expect(root.querySelectorAll('li').length).toBe(0);

    // Valid question submission (within 1-280 code points) appears in the list and clears error
    input.value = 'How does Firestore offline caching work?';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(alertBox.textContent).toBe('');
    expect(input.value).toBe('');
    const items = Array.from(root.querySelectorAll('li'));
    expect(items.length).toBe(1);
    expect(items[0]?.querySelector('.qa-text')?.textContent).toBe(
      'How does Firestore offline caching work?',
    );
    expect(items[0]?.querySelector('.qa-votes')?.textContent).toBe('0');
  });

  it('allows a signed-in user to upvote once and rejects a second upvote by the same user without changing the count (Criterion 3)', async () => {
    const seed: Question[] = [
      { id: 'q1', text: 'First question', authorId: 'u1', votes: 1, createdAt: 1000 },
      { id: 'q2', text: 'Second question', authorId: 'u2', votes: 1, createdAt: 2000 },
    ];
    const store = createMemoryStore(seed);
    mountApp(root, store, 'voter-1');
    await flushPromises();

    // Upvote the second question so it moves to the top with 2 votes
    const initialButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.qa-upvote'));
    expect(initialButtons.length).toBe(2);
    initialButtons[1]?.click();
    await flushPromises();

    const updatedItems = Array.from(root.querySelectorAll('li'));
    expect(updatedItems[0]?.querySelector('.qa-text')?.textContent).toBe('Second question');
    expect(updatedItems[0]?.querySelector('.qa-votes')?.textContent).toBe('2');

    // Attempt a second upvote by the same user on the same question
    const updatedButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.qa-upvote'));
    updatedButtons[0]?.click();
    await flushPromises();

    const alertBox = root.querySelector('[role="alert"]');
    expect(alertBox?.textContent).toContain('Already voted on this question');

    const finalItems = Array.from(root.querySelectorAll('li'));
    expect(finalItems[0]?.querySelector('.qa-text')?.textContent).toBe('Second question');
    expect(finalItems[0]?.querySelector('.qa-votes')?.textContent).toBe('2');
  });

  it('allows a signed-out user to read the list but hides ask and upvote controls (Criterion 4)', async () => {
    const seed: Question[] = [
      { id: 'q1', text: 'Read-only question', authorId: 'u1', votes: 4, createdAt: 1000 },
    ];
    const store = createMemoryStore(seed);
    mountApp(root, store, null);
    await flushPromises();

    const items = Array.from(root.querySelectorAll('li'));
    expect(items.length).toBe(1);
    expect(items[0]?.textContent).toContain('Read-only question');
    expect(items[0]?.textContent).toContain('4');

    expect(root.querySelector('form')).toBeNull();
    expect(root.querySelector('input')).toBeNull();
    expect(root.querySelector('textarea')).toBeNull();
    expect(root.querySelectorAll('button').length).toBe(0);
  });
});
