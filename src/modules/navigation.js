// Navbar: menu móvel, dropdowns acessíveis, destaque da seção atual e foco ao navegar.
export function initNavigation() {
  const nav = document.getElementById('nav');
  const menuButton = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (!nav || !menuButton || !menu) return;

  const groups = [...nav.querySelectorAll('.has-dropdown')];
  const mobile = window.matchMedia('(max-width: 860px)');

  /* ---------- Menu hambúrguer ---------- */
  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('open', open);
    if (!open) closeGroups();
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));

  /* ---------- Dropdowns ---------- */
  const triggerOf = (group) => group.querySelector('.nav-trigger');
  const linksOf = (group) => [...group.querySelectorAll('.dropdown a')];

  function setGroup(group, open) {
    group.classList.toggle('is-open', open);
    triggerOf(group).setAttribute('aria-expanded', String(open));
  }
  function closeGroups(except = null) {
    groups.forEach((group) => { if (group !== except) setGroup(group, false); });
  }

  groups.forEach((group) => {
    const trigger = triggerOf(group);
    const links = linksOf(group);

    trigger.addEventListener('click', () => {
      const willOpen = !group.classList.contains('is-open');
      closeGroups(group);
      setGroup(group, willOpen);
    });

    // Teclado: ↓ abre e vai ao primeiro item; ↑ ↓ Home End percorrem a lista.
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        closeGroups(group);
        setGroup(group, true);
        links[0]?.focus();
      }
    });
    group.querySelector('.dropdown').addEventListener('keydown', (event) => {
      const index = links.indexOf(document.activeElement);
      const move = (target) => { event.preventDefault(); links[(target + links.length) % links.length]?.focus(); };
      if (event.key === 'ArrowDown') move(index + 1);
      else if (event.key === 'ArrowUp') move(index - 1);
      else if (event.key === 'Home') move(0);
      else if (event.key === 'End') move(links.length - 1);
    });

    // Foco saindo do grupo pelo teclado (Tab) fecha a lista.
    group.addEventListener('focusout', (event) => {
      if (event.relatedTarget && !group.contains(event.relatedTarget)) setGroup(group, false);
    });
  });

  // Clique fora fecha dropdowns (e o menu móvel).
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.has-dropdown')) closeGroups();
    if (!event.target.closest('.nav')) setMenu(false);
  });

  // Esc fecha primeiro o dropdown aberto; depois o menu móvel.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const open = groups.find((group) => group.classList.contains('is-open'));
    if (open) {
      const hadFocus = open.contains(document.activeElement);
      setGroup(open, false);
      if (hadFocus) triggerOf(open).focus();
    } else if (nav.classList.contains('open')) {
      setMenu(false);
      menuButton.focus();
    }
  });

  // Ao trocar entre celular e desktop, começa tudo fechado.
  mobile.addEventListener?.('change', () => setMenu(false));

  /* ---------- Navegação por âncoras ---------- */
  // Escolher um item fecha menus e leva o foco ao destino (leitores de tela e teclado).
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    if (link.closest('.nav')) { closeGroups(); setMenu(false); }
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    window.setTimeout(() => target.focus({ preventScroll: true }), 0);
  });

  /* ---------- Sombra ao rolar ---------- */
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Seção ativa ---------- */
  const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
  const setActive = (id) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    groups.forEach((group) => triggerOf(group).classList.toggle('active', linksOf(group).some((link) => link.classList.contains('active'))));
  };
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach((section) => spy.observe(section));
  }
}
