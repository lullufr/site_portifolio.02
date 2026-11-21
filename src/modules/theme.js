import { storage } from './storage.js';
import { prefersReducedMotion } from './motion.js';

const THEME_KEY = 'lulu-portfolio-theme';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const root = document.documentElement;

const savedTheme = () => {
  const value = storage.get(THEME_KEY);
  return value === 'dark' || value === 'light' ? value : null;
};

// O tema inicial já foi aplicado por um script no <head> (sem "piscar").
// Aqui cuidamos do botão, da persistência e da preferência do sistema.
export function initTheme() {
  const button = document.getElementById('themeToggle');
  if (!button) return;
  let animTimer = 0;

  const apply = (theme, { animate = false } = {}) => {
    if (animate && !prefersReducedMotion()) {
      root.classList.add('theme-anim');
      window.clearTimeout(animTimer);
      animTimer = window.setTimeout(() => root.classList.remove('theme-anim'), 650);
    }
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    button.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#201f1b' : '#FBF3DC');
  };

  apply(savedTheme() ?? (systemDark.matches ? 'dark' : 'light'));

  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next, { animate: true });
    storage.set(THEME_KEY, next);
  });

  // Sem escolha salva, acompanha mudanças do sistema em tempo real.
  systemDark.addEventListener?.('change', (event) => {
    if (!savedTheme()) apply(event.matches ? 'dark' : 'light', { animate: true });
  });
}
