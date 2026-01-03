import { router } from '../router';

interface Doc {
  id: string;
  title: string;
  updated_at: string;
}

export async function renderList(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `<div class="list"><p>Loading...</p></div>`;

  const res = await fetch('/api/documents');
  if (!res.ok) return;

  const { data }: { data: Doc[] } = await res.json();

  app.innerHTML = `
    <div class="list">
      <a href="/new" data-navigo class="new">+ New</a>
      ${data.length === 0 ? '<p>No documents</p>' : `
        <ul>
          ${data.map(d => `
            <li>
              <a href="/docs/${d.id}" data-navigo>
                <span>${d.title}</span>
                <time>${new Date(d.updated_at).toLocaleDateString()}</time>
              </a>
            </li>
          `).join('')}
        </ul>
      `}
    </div>
  `;
  router.updatePageLinks();
}
