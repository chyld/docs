import { marked } from 'marked';
import { router } from '../router';

interface Doc {
  id: string;
  title: string;
  content: string;
  attachments: string[];
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov'];

function isImage(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function isVideo(filename: string): boolean {
  const lower = filename.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export async function renderView(id: string): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `<p>Loading...</p>`;

  const res = await fetch(`/api/documents/${id}`);
  if (!res.ok) {
    app.innerHTML = `<p>Document not found</p><a href="/" data-navigo>Back</a>`;
    router.updatePageLinks();
    return;
  }

  const doc: Doc = await res.json();
  const html = await marked(doc.content);

  app.innerHTML = `
    <div class="view-control">
      <div class="action-row">
        <a href="/docs/${id}/edit" data-navigo>Edit</a>
        <label for="file-input">Files</label>
        <input type="file" id="file-input" multiple>
        <button id="upload-btn">Send</button>
      </div>
      <h1>${doc.title}</h1>
      <div>${html}</div>
      <h2>Attachments</h2>
      <div class="attachment-grid">
        ${doc.attachments.map(f => {
          const url = `/api/documents/${id}/attachments/${f}`;
          let box: string;
          if (isImage(f)) {
            box = `<a class="attachment-box" href="${url}"><img src="${url}" alt="${f}" /></a>`;
          } else if (isVideo(f)) {
            box = `<div class="attachment-box"><video src="${url}" controls></video></div>`;
          } else {
            box = `<a class="attachment-box attachment-file" href="${url}"></a>`;
          }
          return `<div class="attachment-item">${box}<span class="attachment-name">${f}</span></div>`;
        }).join('')}
      </div>
    </div>
  `;

  router.updatePageLinks();

  document.getElementById('upload-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      await fetch(`/api/documents/${id}/attachments`, { method: 'POST', body: formData });
    }

    renderView(id);
  });
}
