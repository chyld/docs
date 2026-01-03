import { router } from '../router';

export function renderNew(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `
    <div class="new-control">
      <form id="doc-form">
        <div class="title-row">
          <button type="submit">Save</button>
          <input type="text" name="title" value="Untitled Document" />
        </div>
        <textarea name="content" placeholder="Write..." autofocus></textarea>
      </form>
    </div>
  `;

  const form = app.querySelector<HTMLFormElement>('#doc-form');
  const textarea = form?.querySelector<HTMLTextAreaElement>('textarea');
  textarea?.focus();

  form?.addEventListener('submit', handleSubmit);
  form?.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      form.requestSubmit();
    }
  });
}

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const title = (form.elements.namedItem('title') as HTMLInputElement).value;
  const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;

  if (!title.trim()) return;

  const res = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });

  if (res.ok) {
    const doc = await res.json();
    router.navigate(`/docs/${doc.id}`);
  }
}
