// Terminal demonstrativo: aceita apenas comandos previstos, nunca executa código arbitrário.
export function initTerminal() {
  const terminalForm = document.getElementById('terminalForm');
  const terminalInput = document.getElementById('terminalInput');
  const terminalScreen = document.getElementById('terminalScreen');
  if (!terminalForm || !terminalInput || !terminalScreen) return;

  const terminalCommands = {
    help: 'Comandos disponíveis:\nabout    — um pouco sobre mim\nskills   — tecnologias em aprendizado\nprojects — pesquisas e projetos\ncontact  — formas de contato\nwhoami   — identidade\nclear    — limpar o terminal',
    about: 'Sou Luísa, estudante de Engenharia de Software. Tenho interesse em inteligência artificial, matemática, acessibilidade e tecnologia sustentável.',
    skills: 'Em aprendizado: C, HTML, CSS, SQL/MySQL e Git/GitHub.\nExplorando: IA, acessibilidade digital e sustentabilidade.',
    projects: 'Estudos em andamento:\n01. Proposta de ferramenta de IA\n02. Ciclo de vida e reutilização de hardware\n03. IA para diferentes realidades\nVisite a seção Projetos para ver os estudos de caso.',
    contact: 'Use os links de GitHub, LinkedIn, Instagram ou e-mail na seção Contato. Lembre-se de substituir os endereços de exemplo antes de publicar.',
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
