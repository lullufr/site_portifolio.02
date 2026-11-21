// Preferência de movimento reduzido do sistema (consultada sempre ao vivo).
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => reducedMotion.matches;
