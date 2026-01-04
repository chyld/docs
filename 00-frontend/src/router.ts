import Navigo from 'navigo';
import { renderList } from './views/list';
import { renderView } from './views/view';
import { renderEdit } from './views/edit';

export const router = new Navigo('/');

export function initRouter(): void {
  router
    .on('/', () => {
      renderList();
    })
    .on('/docs/:id', (match) => {
      const id = match?.data?.id;
      if (id) {
        renderView(id);
      }
    })
    .on('/docs/:id/edit', (match) => {
      const id = match?.data?.id;
      if (id) {
        renderEdit(id);
      }
    })
    .notFound(() => {
      const app = document.querySelector<HTMLDivElement>('#app');
      if (app) {
        app.innerHTML = `<p>404 - Page not found</p><a href="/" data-navigo>Back</a>`;
        router.updatePageLinks();
      }
    })
    .resolve();
}
