import { marked } from 'marked';
import { router } from '../router';
import './view.css';

interface Doc {
  id: string;
  title: string;
  color: string;
  content: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
  prev_id: string | null;
  next_id: string | null;
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  app.innerHTML = `
    <div class="view-control">
      <div class="action-row">
        <div class="action-buttons">
          <a href="/docs/${id}/edit" data-navigo>Edit</a>
          <label for="file-input">Files</label>
          <input type="file" id="file-input" multiple>
          <button id="upload-btn">Send</button>
          <a href="${doc.prev_id ? `/docs/${doc.prev_id}` : '#'}" data-navigo class="nav-btn${doc.prev_id ? '' : ' disabled'}">Prev</a>
          <a href="${doc.next_id ? `/docs/${doc.next_id}` : '#'}" data-navigo class="nav-btn${doc.next_id ? '' : ' disabled'}">Next</a>
          ${doc.created_at === doc.updated_at ? '<button id="delete-btn" class="delete-btn">Delete</button>' : ''}
        </div>
        <div class="doc-meta">
          <span class="meta-color" style="background-color: #${doc.color || '606c38'}"></span>
          <span class="meta-id">${doc.id.slice(0, 8)}</span>
          <div class="meta-timestamp">
            <span class="meta-label">Created</span>
            <span class="meta-date">${formatDate(doc.created_at)}</span>
            <span class="meta-time">${formatTime(doc.created_at)}</span>
          </div>
          <div class="meta-timestamp">
            <span class="meta-label">Updated</span>
            <span class="meta-date">${formatDate(doc.updated_at)}</span>
            <span class="meta-time">${formatTime(doc.updated_at)}</span>
          </div>
        </div>
      </div>
      <div>${html}</div>
      ${doc.attachments.length > 0 ? `
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
      ` : ''}
    </div>
  `;

  router.updatePageLinks();

  // Set nav title
  const navTitle = document.getElementById('nav-title');
  if (navTitle) navTitle.textContent = doc.title;

  // Add copy buttons to code blocks
  app.querySelectorAll<HTMLPreElement>('.view-control pre').forEach((pre) => {
    const btn = document.createElement('button');
    btn.className = 'code-copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent || pre.textContent || '';
      await navigator.clipboard.writeText(code);
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    });
    pre.appendChild(btn);
  });

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

  document.getElementById('delete-btn')?.addEventListener('click', async () => {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      router.navigate('/');
    } else if (res.status === 409) {
      alert('Cannot delete - document has been edited');
    } else {
      const body = await res.json();
      alert(body.error || 'Failed to delete document');
    }
  });
}
