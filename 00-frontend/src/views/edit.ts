import { router } from '../router';

export async function renderEdit(id: string): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `<p>Loading...</p>`;

  const res = await fetch(`/api/documents/${id}`);
  if (!res.ok) {
    app.innerHTML = `<p>Document not found</p><a href="/" data-navigo>Back</a>`;
    router.updatePageLinks();
    return;
  }

  const doc = await res.json();

  app.innerHTML = `
    <div class="edit-control">
      <form id="edit-form">
        <div class="title-row">
          <button type="submit">Save</button>
          <input type="text" name="title" value="${doc.title}" />
        </div>
        <textarea name="content">${doc.content}</textarea>
      </form>
    </div>
  `;

  const form = app.querySelector<HTMLFormElement>('#edit-form');
  const textarea = form?.querySelector<HTMLTextAreaElement>('textarea');
  textarea?.focus();

  textarea?.addEventListener('paste', async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(`/api/documents/${id}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const { filename } = await uploadRes.json();
          const url = `/api/documents/${id}/attachments/${filename}`;
          const markdown = `![image](${url})`;

          const pos = textarea.selectionStart;
          const before = textarea.value.slice(0, pos);
          const after = textarea.value.slice(pos);
          textarea.value = before + markdown + after;
          textarea.selectionStart = textarea.selectionEnd = pos + markdown.length;
        }
        return;
      }
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const content = (form.elements.namedItem('content') as HTMLTextAreaElement).value;

    await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    router.navigate(`/docs/${id}`);
  });
}
