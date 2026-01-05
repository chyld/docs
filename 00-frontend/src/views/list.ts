import { router } from '../router';

interface Doc {
  id: string;
  title: string;
  color: string;
  updated_at: string;
}

export async function renderList(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `<div><p>Loading...</p></div>`;

  const res = await fetch('/api/documents');
  if (!res.ok) return;

  const { data }: { data: Doc[] } = await res.json();

  // Clear nav title
  const navTitle = document.getElementById('nav-title');
  if (navTitle) navTitle.textContent = '';

  app.innerHTML = `
    <div class="list-control">
      ${data.length === 0 ? '<p>No documents</p>' : `
        <ul>
          ${data.map(d => `
            <li>
              <a href="/docs/${d.id}" data-navigo>
                <span class="doc-color" style="background-color: #${d.color || '606c38'}"></span>
                <span class="doc-id">${d.id.slice(0, 8)}</span>
                <span class="doc-title">${d.title}</span>
                <time class="doc-date">${new Date(d.updated_at).toLocaleDateString()}</time>
              </a>
            </li>
          `).join('')}
        </ul>
      `}
    </div>
  `;
  router.updatePageLinks();
}
