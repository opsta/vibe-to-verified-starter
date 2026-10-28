import type { QuestionStore } from '../core/store';

/** Mounts the DevFest Q&A board UI into root. */
export function mountApp(root: HTMLElement, store: QuestionStore, userId: string | null): void {
  root.textContent = '';

  const container = document.createElement('section');
  container.className = 'qa-board';

  const heading = document.createElement('h1');
  heading.textContent = 'DevFest Q&A Board';
  container.appendChild(heading);

  const errorBox = document.createElement('div');
  errorBox.setAttribute('role', 'alert');
  errorBox.className = 'qa-error';
  errorBox.hidden = true;
  container.appendChild(errorBox);

  const showError = (err: unknown): void => {
    const message = err instanceof Error ? err.message : String(err);
    errorBox.textContent = message;
    errorBox.hidden = false;
  };

  const clearError = (): void => {
    errorBox.textContent = '';
    errorBox.hidden = true;
  };

  const list = document.createElement('ul');
  list.className = 'qa-list';

  const refreshList = async (): Promise<void> => {
    const questions = await store.list();
    list.textContent = '';
    for (const q of questions) {
      const li = document.createElement('li');
      li.className = 'qa-item';
      li.dataset.questionId = q.id;

      const textSpan = document.createElement('span');
      textSpan.className = 'qa-text';
      textSpan.textContent = q.text;
      li.appendChild(textSpan);

      const votesSpan = document.createElement('span');
      votesSpan.className = 'qa-votes';
      votesSpan.textContent = String(q.votes);
      li.appendChild(votesSpan);

      if (userId !== null) {
        const upvoteBtn = document.createElement('button');
        upvoteBtn.type = 'button';
        upvoteBtn.className = 'qa-upvote';
        upvoteBtn.textContent = 'Upvote';
        upvoteBtn.addEventListener('click', () => {
          void store
            .upvote(q.id, userId)
            .then(async () => {
              clearError();
              await refreshList();
            })
            .catch((err: unknown) => {
              showError(err);
            });
        });
        li.appendChild(upvoteBtn);
      }

      list.appendChild(li);
    }
  };

  if (userId !== null) {
    const form = document.createElement('form');
    form.className = 'qa-form';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'question';
    input.placeholder = 'Ask a question (1-280 code points)';
    input.setAttribute('aria-label', 'Question text');
    form.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Ask';
    form.appendChild(submitBtn);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      void store
        .ask(input.value, userId)
        .then(async () => {
          input.value = '';
          clearError();
          await refreshList();
        })
        .catch((err: unknown) => {
          showError(err);
        });
    });

    container.appendChild(form);
  }

  container.appendChild(list);
  root.appendChild(container);

  void refreshList();
}
