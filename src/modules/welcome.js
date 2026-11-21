import { storage } from './storage.js';
import { prefersReducedMotion } from './motion.js';

const NAME_KEY = 'lulu-portfolio-visitor-name';
const SEEN_KEY = 'lulu-portfolio-welcome-seen';
const MAX_LENGTH = 30;
// Letras (qualquer idioma), espaço, hífen, apóstrofo e ponto. Nada de HTML.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} '’.\-]*$/u;

/** Remove caracteres de controle e espaços sobrando; normaliza acentos. */
export function sanitizeName(raw) {
  return String(raw ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateName(name) {
  if (!name) return { ok: false, message: 'Digite seu nome ou escolha continuar sem informar.' };
  if (name.length > MAX_LENGTH) return { ok: false, message: `Use até ${MAX_LENGTH} caracteres.` };
  if (!NAME_PATTERN.test(name)) return { ok: false, message: 'Use apenas letras, espaços, hífen ou apóstrofo.' };
  return { ok: true, message: '' };
}

export function initWelcome() {
  const dialog = document.getElementById('welcome');
  const form = document.getElementById('welcomeForm');
  const input = document.getElementById('visitorName');
  const errorBox = document.getElementById('welcomeError');
  const skipButton = document.getElementById('welcomeSkip');
  const submitButton = document.getElementById('welcomeSubmit');
  const title = document.getElementById('welcomeTitle');
  const text = document.getElementById('welcomeText');
  const hello = document.getElementById('greetingHello');
  const sub = document.getElementById('greetingSub');
  const editButton = document.getElementById('greetingEdit');
  if (!dialog || !form || !input || !hello || !sub || !editButton) return;

  const stored = sanitizeName(storage.get(NAME_KEY));
  let currentName = validateName(stored).ok ? stored : '';
  let mode = 'first'; // 'first' = primeira visita · 'edit' = alterar nome depois
  let closing = false;

  /* ---------- Saudação no hero (sempre via textContent: nunca HTML) ---------- */
  function renderGreeting({ animate = false } = {}) {
    if (currentName) {
      hello.textContent = `Olá, ${currentName}!`;
      sub.textContent = 'Seja bem-vindo. Vamos conhecer a Luísa?';
      sub.hidden = false;
      editButton.textContent = 'Alterar nome';
    } else {
      hello.textContent = 'Olá! Seja bem-vindo.';
      sub.textContent = '';
      sub.hidden = true;
      editButton.textContent = 'Informar meu nome';
    }
    if (animate && !prefersReducedMotion()) {
      [hello, sub].forEach((el) => {
        el.classList.remove('greeting-pop');
        void el.offsetWidth; // reinicia a animação
        el.classList.add('greeting-pop');
      });
    }
  }
  renderGreeting();

  // Navegador sem <dialog>: o site segue normal, só sem a janela.
  if (typeof dialog.showModal !== 'function') {
    editButton.hidden = true;
    return;
  }

  /* ---------- Janela ---------- */
  const setError = (message = '') => {
    errorBox.textContent = message;
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  function openDialog(nextMode) {
    if (dialog.open) return;
    mode = nextMode;
    closing = false;
    setError();
    if (mode === 'edit') {
      title.textContent = 'Alterar nome';
      text.textContent = 'Como você prefere ser chamado?';
      submitButton.textContent = 'Salvar';
      input.value = currentName;
    } else {
      title.textContent = 'Antes de começarmos...';
      text.textContent = 'Que tal nos apresentarmos primeiro? Como posso te chamar?';
      submitButton.textContent = 'Vamos começar';
      input.value = '';
    }
    document.body.classList.add('modal-open');
    dialog.showModal();
    if (mode === 'edit') input.select();
  }

  function closeDialog() {
    if (!dialog.open || closing) return;
    if (prefersReducedMotion()) { dialog.close(); return; }
    closing = true;
    dialog.classList.add('is-closing');
    window.setTimeout(() => {
      dialog.close();
      dialog.classList.remove('is-closing');
      closing = false;
    }, 270);
  }

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    // Se o navegador fechou a janela por conta própria (ex.: Esc duas vezes), não pergunta de novo.
    if (mode === 'first' && !storage.get(SEEN_KEY)) storage.set(SEEN_KEY, '1');
  });

  const finish = (name) => {
    currentName = name;
    if (name) storage.set(NAME_KEY, name); else storage.remove(NAME_KEY);
    storage.set(SEEN_KEY, '1');
    renderGreeting({ animate: true });
    closeDialog();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = sanitizeName(input.value);
    const result = validateName(name);
    if (!result.ok) {
      setError(result.message);
      input.focus();
      return;
    }
    finish(name);
  });
  input.addEventListener('input', () => setError());
  skipButton.addEventListener('click', () => finish(''));

  // Esc: na primeira visita equivale a "continuar sem informar"; na edição, só cancela.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    if (mode === 'first') finish(''); else closeDialog();
  });
  // Clique no fundo escurecido cancela apenas a edição.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog && mode === 'edit') closeDialog();
  });

  editButton.addEventListener('click', () => openDialog('edit'));

  // Primeira visita: aparece logo depois que o hero começa a se desenhar.
  if (!storage.get(SEEN_KEY)) window.setTimeout(() => openDialog('first'), 700);
}
