import { router } from '../router';

export function renderNew(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `
    <form id="doc-form" class="editor">
      <input type="text" name="title" value="Untitled Document" autofocus />
      <textarea name="content" placeholder="Write..."></textarea>
      <button type="submit">Save</button>
    </form>
  `;

  const form = app.querySelector<HTMLFormElement>('#doc-form');
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
