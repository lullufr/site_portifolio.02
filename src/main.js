import { initTheme } from './modules/theme.js';
import { initNavigation } from './modules/navigation.js';
import { initWelcome } from './modules/welcome.js';
import { initProgress } from './modules/progress.js';
import { initInfinity } from './modules/infinity.js';
import { initReveal } from './modules/reveal.js';
import { initCaseStudies } from './modules/case-studies.js';
import { initTerminal } from './modules/terminal.js';

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

initTheme();
initNavigation();
initWelcome();
initProgress();
initInfinity();
initReveal();
initCaseStudies();
initTerminal();
