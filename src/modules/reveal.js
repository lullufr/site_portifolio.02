import { prefersReducedMotion } from './motion.js';

const TARGETS = [
  '.section .eyebrow', '.section h2:not(.sr-only)', '.section-intro',
  '.timeline-item', '.skill-card', '.hobby-card', '.case-card', '.lab-item',
  '.beyond-grid article', '.soft-item', '.resume-card', '.goal',
  '.principles blockquote', '.principles-note', '.social li',
].join(', ');

// Entrada discreta das seções ao rolar. As classes de animação são removidas
// no final, para não interferir nos efeitos de hover dos cartões.
export function initReveal() {
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const elements = [...document.querySelectorAll(TARGETS)];
  const siblings = new Map();
  elements.forEach((el) => {
    const list = siblings.get(el.parentElement) ?? [];
    list.push(el);
    siblings.set(el.parentElement, list);
  });
  siblings.forEach((list) => list.forEach((el, index) => {
    el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 70}ms`);
  }));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);
      el.classList.add('is-visible');
      const delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
      window.setTimeout(() => {
        el.classList.remove('js-reveal', 'is-visible');
        el.style.removeProperty('--reveal-delay');
      }, 1300 + delay);
    });
  }, { threshold: 0.12 });

  elements.forEach((el) => {
    el.classList.add('js-reveal');
    observer.observe(el);
  });
}
