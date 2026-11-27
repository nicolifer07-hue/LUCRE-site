const indexes = new Map();
const pageSize = 9;

function getIndex(kind) {
  if (!indexes.has(kind)) {
    const request = fetch('/LUCRE-site/lucre/catalogo-' + kind + '.json')
      .then(response => {
        if (!response.ok) throw new Error('Catálogo indisponível');
        return response.json();
      })
      .catch(error => {
        indexes.delete(kind);
        throw error;
      });
    indexes.set(kind, request);
  }
  return indexes.get(kind);
}

function normalize(text) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function makeCard(row) {
  const [path, title, description, date, , tag] = row;
  const item = element('div', 'catalogo__item');
  const article = element('article', 'card-post');
  const link = element('a', 'card-post__link');
  link.href = path;
  if (tag) link.append(element('span', 'card-post__tag', tag));
  link.append(element('h2', 'card-post__titulo', title));
  if (description) link.append(element('p', 'card-post__resumo', description));
  if (date) {
    const footer = element('div', 'card-post__rodape');
    footer.append(element('span', 'card-post__data-pequena', date));
    link.append(footer);
  }
  for (const node of [article, link, ...link.querySelectorAll('*')]) {
    node.setAttribute('data-astro-cid-3oumuf63', '');
  }
  article.append(link);
  item.append(article);
  return item;
}

async function initCatalog() {
  const root = document.querySelector('#catalogo[data-local-index]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const grade = root.querySelector('#catalogoGrade');
  const original = new Map([...grade.querySelectorAll('.catalogo__item')].map(item => [
    item.querySelector('.card-post__link')?.getAttribute('href'), item,
  ]));
  const nav = root.querySelector('nav.paginacao');
  const form = document.getElementById('catalogoBuscaForm');
  const input = document.getElementById('catalogoBuscaCampo');
  const clear = document.getElementById('catalogoBuscaLimpar');
  const filters = [...root.querySelectorAll('.js-filtro')];
  const filterToggle = document.getElementById('catalogoFiltroBotao');
  const filterPanel = document.getElementById('catalogoFiltroJanela');
  const activeName = document.getElementById('catalogoFiltroAtivo');
  const featured = document.getElementById('catalogoDestaque');
  const empty = document.getElementById('catalogoBuscaVazio');
  const parameter = root.dataset.parametro;
  const defaultFilter = root.dataset.defaultFilter || '';
  const params = new URLSearchParams(location.search);
  if (!form || !input || !grade || !nav) return;
  input.value = params.get('busca') || '';
  let filter = params.has(parameter) ? params.get(parameter) : defaultFilter;
  let page = Math.max(1, parseInt(params.get('pagina'), 10) || 1);
  if (!filters.some(button => button.dataset.valor === filter)) filter = '';

  let rows;
  try { rows = await getIndex(root.dataset.localIndex); }
  catch { return; }
  if (!root.isConnected) return;
  filterToggle?.addEventListener('click', () => setPanel(filterPanel.hidden));

  function setPanel(open) {
    if (!filterPanel || !filterToggle) return;
    filterPanel.hidden = !open;
    filterToggle.setAttribute('aria-expanded', String(open));
  }

  function render() {
    const terms = normalize(input.value).split(/\s+/).filter(Boolean);
    const matches = rows.filter(row =>
      (!filter || row[4].includes(filter)) &&
      terms.every(term => normalize(row[1] + ' ' + row[2]).includes(term))
    );
    const last = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, last);
    if (featured) featured.hidden = page > 1 || Boolean(filter) || terms.length > 0;
    const slice = matches.slice((page - 1) * pageSize, page * pageSize);
    grade.replaceChildren(...slice.map(row => original.get(row[0]) || makeCard(row)));
    if (empty) empty.hidden = matches.length !== 0;
    if (clear) clear.hidden = !input.value;
    const active = filters.find(button => button.dataset.valor === filter);
    if (activeName) {
      activeName.hidden = !active;
      activeName.textContent = active?.textContent.trim().replace(/\s+\d+$/, '') || '';
    }
    filters.forEach(button => {
      const selected = button.dataset.valor === filter;
      button.classList.toggle('is-ativo', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    nav.hidden = last <= 1;
    nav.replaceChildren(
      pageButton('Anterior', page - 1, page === 1),
      element('span', 'catalogo-local__page', 'Página ' + page + ' de ' + last),
      pageButton('Próxima', page + 1, page === last)
    );
    const url = new URL(location.href);
    const set = (key, value) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
    set('busca', input.value.trim());
    set(parameter, filter === defaultFilter ? '' : filter || 'todos');
    set('pagina', page > 1 ? String(page) : '');
    if (url.href !== location.href) history.replaceState(history.state, '', url);
  }

  function pageButton(label, target, disabled) {
    const button = element('button', 'catalogo-local__button', label);
    button.type = 'button';
    button.disabled = disabled;
    button.addEventListener('click', () => {
      page = target;
      render();
      root.scrollIntoView({block: 'start'});
    });
    return button;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    page = 1;
    render();
  });
  input.addEventListener('input', () => { page = 1; render(); });
  clear?.addEventListener('click', () => {
    input.value = '';
    page = 1;
    render();
    input.focus();
  });
  filters.forEach(button => {
    const count = button.querySelector('.catalogo-janela__n, .catalogo-lateral__n');
    if (count) count.textContent = button.dataset.valor ? rows.filter(row => row[4].includes(button.dataset.valor)).length : rows.length;
    button.addEventListener('click', () => {
      filter = filter === button.dataset.valor ? '' : button.dataset.valor;
      page = 1;
      setPanel(false);
      render();
    });
  });
  render();
}

document.addEventListener('astro:page-load', initCatalog);
initCatalog();
