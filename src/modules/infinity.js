import { reducedMotion } from './motion.js';

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
export function parseCubicPath(d) {
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
export function samplePath(segments, count) {
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

export function initInfinity() {
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
