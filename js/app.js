/* Luisa Ferreira — The Infinite Mind
 * Script único e clássico (sem import/export): funciona ao abrir o index.html
 * com duplo clique, no `npm run dev` e na versão publicada. */
(function () {
  "use strict";

  /* ---- motion ---- */
  // Preferência de movimento reduzido do sistema (consultada sempre ao vivo).
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reducedMotion.matches;

  /* ---- storage ---- */
  // Acesso seguro ao localStorage. Em navegação privativa ou com o armazenamento
  // bloqueado, o site continua funcionando e guarda os valores só na sessão atual.
  const memory = new Map();

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memory.has(key) ? memory.get(key) : null;
      }
    },
    set(key, value) {
      memory.set(key, value);
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* sem armazenamento: o valor fica apenas em memória */
      }
    },
    remove(key) {
      memory.delete(key);
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* sem armazenamento */
      }
    },
  };

  /* ---- theme ---- */
  const theme = (function () {

    const THEME_KEY = 'lulu-portfolio-theme';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    const savedTheme = () => {
      const value = storage.get(THEME_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    };

    // O tema inicial já foi aplicado por um script no <head> (sem "piscar").
    // Aqui cuidamos do botão, da persistência e da preferência do sistema.
    function initTheme() {
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

    return { initTheme };
  })();

  /* ---- navigation ---- */
  const navigation = (function () {
    // Navbar: menu móvel, dropdowns acessíveis, destaque da seção atual e foco ao navegar.
    function initNavigation() {
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

    return { initNavigation };
  })();

  /* ---- welcome ---- */
  const welcome = (function () {

    const NAME_KEY = 'lulu-portfolio-visitor-name';
    const SEEN_KEY = 'lulu-portfolio-welcome-seen';
    const MAX_LENGTH = 30;
    // Letras (qualquer idioma), espaço, hífen, apóstrofo e ponto. Nada de HTML.
    const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} '’.\-]*$/u;

    /** Remove caracteres de controle e espaços sobrando; normaliza acentos. */
    function sanitizeName(raw) {
      return String(raw ?? '')
        .normalize('NFC')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function validateName(name) {
      if (!name) return { ok: false, message: 'Digite seu nome ou escolha continuar sem informar.' };
      if (name.length > MAX_LENGTH) return { ok: false, message: `Use até ${MAX_LENGTH} caracteres.` };
      if (!NAME_PATTERN.test(name)) return { ok: false, message: 'Use apenas letras, espaços, hífen ou apóstrofo.' };
      return { ok: true, message: '' };
    }

    function initWelcome() {
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
          sub.textContent = 'Seja bem-vindo. Vamos conhecer a Luisa?';
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

    return { sanitizeName, validateName, initWelcome };
  })();

  /* ---- progress ---- */
  const progress = (function () {
    // Bateria de progresso: acompanha a posição real da rolagem.
    function initProgress() {
      const battery = document.getElementById('battery');
      const label = document.getElementById('batteryLabel');
      if (!battery || !label) return;

      let queued = false;
      let lastPercent = -1;

      const update = () => {
        queued = false;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
        battery.style.setProperty('--p', ratio.toFixed(4));

        const percent = Math.round(ratio * 100);
        if (percent !== lastPercent) {
          lastPercent = percent;
          label.textContent = `${percent}%`;
          battery.setAttribute('aria-valuenow', String(percent));
          battery.setAttribute('aria-valuetext', `${percent}% da página percorrida`);
        }
      };
      const request = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
      };

      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      // A altura da página muda quando fontes e conteúdos carregam ou abrem.
      if ('ResizeObserver' in window) new ResizeObserver(request).observe(document.body);
      update();
    }

    return { initProgress };
  })();

  /* ---- infinity ---- */
  const infinity = (function () {

    /*
      Infinito elástico
      -----------------
      O desenho original (um caminho de 4 curvas de Bézier) é amostrado em pontos
      igualmente espaçados. Cada ponto é preso ao seu lugar de origem por uma mola:
      quando o cursor se move por perto, os pontos próximos são puxados suavemente
      em direção a ele; quando o cursor para, as molas devolvem o traço ao formato
      original, com um leve efeito elástico. Em repouso o desenho volta a usar o
      caminho original, sem nenhuma alteração.

      O ponto que percorre o infinito acompanha o traço deformado.
      Desativado em telas de toque e com "movimento reduzido".
    */

    const POINTS = 100;        // pontos usados na amostragem
    const RADIUS = 75;         // alcance do cursor (unidades do viewBox 400×200)
    const PULL = 0.8;          // intensidade da atração (deslocamento máx. ≈ 9 unidades)
    const STIFFNESS = 60;      // rigidez da mola
    const DAMPING = 8;         // amortecimento (elasticidade delicada)
    const IDLE_MS = 140;       // tempo parado até o cursor "soltar" o traço
    const LOOP_MS = 14000;     // volta completa do ponto (igual ao desenho original)
    const STROKE_PX = 1.6;     // espessura do traço na tela, em pixels
    const SETTLE_DISTANCE = 0.03;
    const SETTLE_SPEED = 0.05;

    const cubic = (p0, p1, p2, p3, t) => {
      const u = 1 - t;
      const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
      return [
        a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
        a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
      ];
    };

    /** Lê um caminho "M x y C …" (somente curvas cúbicas) e devolve os segmentos. */
    function parseCubicPath(d) {
      const numbers = (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);
      const segments = [];
      let current = [numbers[0], numbers[1]];
      for (let i = 2; i + 5 < numbers.length; i += 6) {
        const p1 = [numbers[i], numbers[i + 1]];
        const p2 = [numbers[i + 2], numbers[i + 3]];
        const p3 = [numbers[i + 4], numbers[i + 5]];
        segments.push([current, p1, p2, p3]);
        current = p3;
      }
      return segments;
    }

    /** Amostra o caminho em `count` pontos com espaçamento igual ao longo do traço. */
    function samplePath(segments, count) {
      const dense = [];
      const steps = 48;
      segments.forEach(([p0, p1, p2, p3]) => {
        for (let i = 0; i < steps; i++) dense.push(cubic(p0, p1, p2, p3, i / steps));
      });
      dense.push(segments[segments.length - 1][3]);

      const cumulative = [0];
      for (let i = 1; i < dense.length; i++) {
        cumulative.push(cumulative[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
      }
      const total = cumulative[cumulative.length - 1];

      const points = [];
      let j = 1;
      for (let k = 0; k < count; k++) {
        const target = (total * k) / count;
        while (cumulative[j] < target) j++;
        const span = cumulative[j] - cumulative[j - 1] || 1;
        const t = (target - cumulative[j - 1]) / span;
        points.push([
          dense[j - 1][0] + (dense[j][0] - dense[j - 1][0]) * t,
          dense[j - 1][1] + (dense[j][1] - dense[j - 1][1]) * t,
        ]);
      }
      return points;
    }

    function initInfinity() {
      const hero = document.getElementById('inicio');
      const svg = document.getElementById('heroInf');
      const path = document.getElementById('infPath');
      const dot = document.getElementById('infDot');
      if (!hero || !svg || !path || !dot) return;

      const viewBox = svg.viewBox.baseVal;

      // Espessura constante na tela (1,6 px) e comprimento exato do tracejado de entrada.
      const updateStroke = () => {
        const width = svg.getBoundingClientRect().width;
        if (width) svg.style.setProperty('--inf-stroke', ((STROKE_PX * viewBox.width) / width).toFixed(4));
      };
      svg.style.setProperty('--inf-len', String(Math.ceil(path.getTotalLength()) + 2));
      updateStroke();
      if ('ResizeObserver' in window) new ResizeObserver(updateStroke).observe(svg);
      else window.addEventListener('resize', updateStroke);
      // Terminado o desenho, remove o tracejado: o traço fica contínuo mesmo ao ser deformado.
      path.addEventListener('animationend', () => path.classList.remove('inf-draw'), { once: true });

      const originalD = path.getAttribute('d');
      const rest = samplePath(parseCubicPath(originalD), POINTS);
      const n = rest.length;
      const baseX = Float32Array.from(rest, (p) => p[0]);
      const baseY = Float32Array.from(rest, (p) => p[1]);
      const offX = new Float32Array(n), offY = new Float32Array(n);
      const velX = new Float32Array(n), velY = new Float32Array(n);

      const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');

      let rafId = 0;
      let lastTime = 0;
      let pointer = null;        // posição do cursor em coordenadas do viewBox
      let lastMove = -Infinity;
      let deformed = false;      // o caminho atual difere do original?
      let visible = true;
      let started = false;

      const fmt = (v) => v.toFixed(2);

      /** Curva suave e fechada (Catmull-Rom → Bézier) passando pelos pontos atuais. */
      function buildPath() {
        const px = (i) => baseX[(i + n) % n] + offX[(i + n) % n];
        const py = (i) => baseY[(i + n) % n] + offY[(i + n) % n];
        const out = [`M${fmt(px(0))} ${fmt(py(0))}`];
        for (let i = 0; i < n; i++) {
          out.push(
            `C${fmt(px(i) + (px(i + 1) - px(i - 1)) / 6)} ${fmt(py(i) + (py(i + 1) - py(i - 1)) / 6)} ` +
            `${fmt(px(i + 1) - (px(i + 2) - px(i)) / 6)} ${fmt(py(i + 1) - (py(i + 2) - py(i)) / 6)} ` +
            `${fmt(px(i + 1))} ${fmt(py(i + 1))}`
          );
        }
        out.push('Z');
        return out.join('');
      }

      function placeDot(now) {
        const f = ((now % LOOP_MS) / LOOP_MS) * n;
        const i = Math.floor(f) % n;
        const j = (i + 1) % n;
        const t = f - Math.floor(f);
        const x = baseX[i] + offX[i] + (baseX[j] + offX[j] - baseX[i] - offX[i]) * t;
        const y = baseY[i] + offY[i] + (baseY[j] + offY[j] - baseY[i] - offY[i]) * t;
        dot.setAttribute('cx', fmt(x));
        dot.setAttribute('cy', fmt(y));
      }

      function frame(now) {
        rafId = requestAnimationFrame(frame);
        const dt = Math.min(0.032, (now - lastTime) / 1000 || 0.016);
        lastTime = now;

        const pulling = pointer !== null && now - lastMove < IDLE_MS;
        let maxOffset = 0, maxSpeed = 0;

        for (let i = 0; i < n; i++) {
          let targetX = 0, targetY = 0;
          if (pulling) {
            const dx = pointer.x - baseX[i];
            const dy = pointer.y - baseY[i];
            const distance = Math.hypot(dx, dy);
            if (distance < RADIUS) {
              const weight = 1 - distance / RADIUS;
              const strength = PULL * weight * weight;
              targetX = dx * strength;
              targetY = dy * strength;
            }
          }
          velX[i] += (STIFFNESS * (targetX - offX[i]) - DAMPING * velX[i]) * dt;
          velY[i] += (STIFFNESS * (targetY - offY[i]) - DAMPING * velY[i]) * dt;
          offX[i] += velX[i] * dt;
          offY[i] += velY[i] * dt;
          maxOffset = Math.max(maxOffset, Math.abs(offX[i]), Math.abs(offY[i]));
          maxSpeed = Math.max(maxSpeed, Math.abs(velX[i]), Math.abs(velY[i]));
        }

        const settled = !pulling && maxOffset < SETTLE_DISTANCE && maxSpeed < SETTLE_SPEED;
        if (settled) {
          if (deformed) {
            // Em repouso: volta exatamente ao desenho original.
            offX.fill(0); offY.fill(0); velX.fill(0); velY.fill(0);
            path.setAttribute('d', originalD);
            deformed = false;
          }
        } else {
          path.setAttribute('d', buildPath());
          deformed = true;
        }
        placeDot(now);
      }

      function start() {
        if (rafId || reducedMotion.matches || !visible) return;
        lastTime = performance.now();
        rafId = requestAnimationFrame(frame);
      }
      function stop() {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      function restore() {
        stop();
        offX.fill(0); offY.fill(0); velX.fill(0); velY.fill(0);
        path.setAttribute('d', originalD);
        deformed = false;
        pointer = null;
      }

      function onPointerMove(event) {
        if (event.pointerType === 'touch' || reducedMotion.matches) return;
        const rect = svg.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        pointer = {
          x: ((event.clientX - rect.left) / rect.width) * viewBox.width,
          y: ((event.clientY - rect.top) / rect.height) * viewBox.height,
        };
        lastMove = performance.now();
        start();
      }

      function enableDot() {
        // O JS passa a conduzir o ponto (que acompanha o traço deformado).
        dot.querySelector('animateMotion')?.remove();
        dot.style.display = '';
        started = true;
      }

      function apply() {
        if (reducedMotion.matches) {
          // Movimento reduzido: sem efeito, sem ponto em movimento.
          restore();
          dot.style.display = 'none';
          return;
        }
        enableDot();
        start();
      }

      // Efeito do cursor só em dispositivos com mouse/caneta.
      if (hoverCapable.matches) {
        hero.addEventListener('pointermove', onPointerMove, { passive: true });
        hero.addEventListener('pointerleave', () => { pointer = null; });
      }

      // Economiza recursos quando o hero não está visível.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && started) start(); else stop();
        }).observe(hero);
      }

      reducedMotion.addEventListener?.('change', apply);
      apply();
    }

    return { parseCubicPath, samplePath, initInfinity };
  })();

  /* ---- reveal ---- */
  const reveal = (function () {

    const TARGETS = [
      '.section .eyebrow', '.section h2:not(.sr-only)', '.section-intro',
      '.timeline-item', '.skill-card', '.hobby-card', '.case-card', '.lab-item',
      '.beyond-grid article', '.soft-item', '.resume-card', '.goal',
      '.principles blockquote', '.principles-note', '.social li',
    ].join(', ');

    // Entrada discreta das seções ao rolar. As classes de animação são removidas
    // no final, para não interferir nos efeitos de hover dos cartões.
    function initReveal() {
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

    return { initReveal };
  })();

  /* ---- case-studies ---- */
  const caseStudies = (function () {
    // Estudos de caso: botão que abre e fecha os detalhes de cada cartão.
    function initCaseStudies() {
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

    return { initCaseStudies };
  })();

  /* ---- terminal ---- */
  const terminal = (function () {
    // Terminal demonstrativo: aceita apenas comandos previstos, nunca executa código arbitrário.
    function initTerminal() {
      const terminalForm = document.getElementById('terminalForm');
      const terminalInput = document.getElementById('terminalInput');
      const terminalScreen = document.getElementById('terminalScreen');
      if (!terminalForm || !terminalInput || !terminalScreen) return;

      const terminalCommands = {
        help: 'Comandos disponíveis:\nabout    — um pouco sobre mim\nskills   — tecnologias em aprendizado\nprojects — pesquisas e projetos\ncontact  — formas de contato\nwhoami   — identidade\nclear    — limpar o terminal',
        about: 'Sou Luisa, estudante de Engenharia de Software. Tenho interesse em inteligência artificial, matemática, acessibilidade e tecnologia sustentável.',
        skills: 'Em aprendizado: C, HTML, CSS, SQL/MySQL e Git/GitHub.\nExplorando: IA, acessibilidade digital e sustentabilidade.',
        projects: 'Estudos em andamento:\n01. Proposta de ferramenta de IA\n02. Ciclo de vida e reutilização de hardware\n03. IA para diferentes realidades\nVisite a seção Projetos para ver os estudos de caso.',
        contact: 'Use os links de GitHub, LinkedIn, Instagram ou e-mail na seção Contato.',
        whoami: 'luisa — estudante, curiosa por natureza e interessada em construir tecnologia com propósito.',
        clear: '',
      };

      const appendTerminalLine = (content, className = 'terminal-output') => {
        const line = document.createElement('p');
        line.className = className;
        line.textContent = content;
        terminalScreen.appendChild(line);
        terminalScreen.scrollTop = terminalScreen.scrollHeight;
      };

      const runCommand = (raw) => {
        const command = raw.trim().toLowerCase();
        if (!command) return;
        if (command === 'clear') { terminalScreen.replaceChildren(); return; }
        appendTerminalLine(`luisa@infinite-mind:~$ ${command}`, 'terminal-output muted');
        appendTerminalLine(Object.hasOwn(terminalCommands, command) ? terminalCommands[command] : `Comando não encontrado: ${command}. Digite help para ver as opções.`);
      };

      terminalForm.addEventListener('submit', (event) => {
        event.preventDefault();
        runCommand(terminalInput.value);
        terminalInput.value = '';
      });
      document.querySelectorAll('[data-command]').forEach((button) => {
        button.addEventListener('click', () => runCommand(button.dataset.command));
      });
    }

    return { initTerminal };
  })();


(function () {
  const root = document.getElementById('hobbyCarousel');
  if (!root) return;
  const track = root.querySelector('.carousel-track');
  const prev = root.querySelector('[data-dir="-1"]');
  const next = root.querySelector('[data-dir="1"]');

  const update = () => {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  const go = (dir) => {
    const slide = track.querySelector('.carousel-slide');
    const step = slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16);
    track.scrollBy({ left: dir * step });
  };

  root.querySelectorAll('.carousel-btn').forEach((btn) =>
    btn.addEventListener('click', () => go(Number(btn.dataset.dir))));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

  /* ---- início ---- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Cada parte inicia isolada: se uma falhar, as demais continuam funcionando.
  [
    theme.initTheme, navigation.initNavigation, welcome.initWelcome,
    progress.initProgress, infinity.initInfinity, reveal.initReveal,
    caseStudies.initCaseStudies, terminal.initTerminal,
  ].forEach((init) => {
    try { init(); } catch (error) { console.error(error); }
  });
})();
