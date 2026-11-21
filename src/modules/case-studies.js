// Estudos de caso: botão que abre e fecha os detalhes de cada cartão.
export function initCaseStudies() {
  document.querySelectorAll('.case-toggle').forEach((button) => {
    const card = button.closest('.case-card');
    const label = button.querySelector('.case-toggle-label');
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      card.classList.toggle('is-open', open);
      label.textContent = open ? 'Recolher estudo de caso' : 'Ver estudo de caso';
    });
  });
}
