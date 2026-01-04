import './style.css';
import { initRouter, router } from './router';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();

  document.getElementById('new-doc-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled Document', content: '' }),
    });
    if (res.ok) {
      const doc = await res.json();
      router.navigate(`/docs/${doc.id}/edit`);
    }
  });
});
