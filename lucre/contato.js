const formSelector = '[data-lucre-contact]';

function enableContactForm() {
  const form = document.querySelector(formSelector);
  if (form) form.hidden = false;
}

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || !form.matches(formSelector)) return;
  event.preventDefault();
  const values = new FormData(form);
  const name = String(values.get('nome') ?? '').trim();
  const company = String(values.get('empresa') ?? '').trim();
  const details = String(values.get('objetivo') ?? '').trim();
  const destination = new URL('https://wa.me/5514991452454');
  const lines = [
    'Olá gostaria de marcar uma reunião para entender como minha empresa pode crescer com a Lucre',
    '',
    'Nome: ' + name,
    'Empresa: ' + company,
  ];
  if (details) lines.push('Objetivo: ' + details);
  destination.searchParams.set('text', lines.join('\n'));
  window.location.assign(destination.href);
});

document.addEventListener('astro:page-load', enableContactForm);
enableContactForm();
