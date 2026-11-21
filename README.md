# Luísa Ferreira — The Infinite Mind

Portfólio pessoal de página única, feito com HTML, CSS e JavaScript puros, empacotado com [Vite](https://vitejs.dev/). Sem bibliotecas extras: a única dependência é o próprio Vite.

## Antes de publicar: troque os placeholders

- **Foto:** coloque sua imagem em `assets/` (ex.: `assets/foto.jpg`) e altere o `src` e o `alt` da tag `<img>` na seção Início em `index.html`.
- **Contato:** o GitHub já aponta para `github.com/lullufr`. Substitua `SEU-USUARIO` nos links de LinkedIn e Instagram e `seu-email@exemplo.com` no e-mail.
- **Estudos de caso (`#projetos`):** os campos entre colchetes (Objetivo, Tecnologias, Resultados…) são espaços reservados, e o quarto cartão (`04 / ESPAÇO RESERVADO`) está pronto para o próximo projeto. Cada cartão tem os campos Problema, Contexto, Objetivo, Processo, Tecnologias e Resultados e aprendizados. Copie um bloco `<article class="case-card">` para adicionar outros e use ids novos (`case-5-details` etc.) no botão e no painel.
- **Hobbies (`#hobbies`):** os dois cartões com `[Seu hobby]` aguardam os seus interesses. Os cartões "Matemática" e "Explorar tecnologia" partem do que já está no portfólio; ajuste se quiser.
- **Trajetória, Soft Skills e Resumo:** revise os textos e as datas para que reflitam exatamente a sua história.
- **Terminal:** o comando `contact` ainda diz para substituir os endereços de exemplo. Atualize essa frase na seção `terminal` de `js/app.js` quando os links estiverem prontos.

## O que o site tem

- **Navbar** com Início, **Profissional** (Minha trajetória, Universo tecnológico, Laboratório de ideias, Estudos de caso, Beyond the Code), **Pessoal** (Hobbies, Soft Skills, Resumo sobre mim) e Contato. Os menus abrem ao clicar, fecham ao clicar de novo, fora, com `Esc` ou ao escolher um item, e funcionam pelo teclado (`Enter`, `↓`, `↑`, `Home`, `End`). No celular viram sanfonas dentro do menu hambúrguer.
- **Modo claro/escuro** pelo botão de sol/lua. A escolha fica salva; na primeira visita, o site segue a preferência do sistema.
- **Boas-vindas:** na primeira visita, uma janelinha pergunta o nome. O nome aparece na saudação do início (sem tomar o lugar do seu nome) e pode ser alterado depois pelo botão "Alterar nome". O nome é validado e sempre tratado como texto simples.
- **Infinito elástico:** no Início, o símbolo reage ao mouse com uma atração delicada e volta ao formato original quando o cursor para. Em telas de toque o efeito é desativado.
- **Bateria de progresso** fixa e discreta, centralizada na base da tela, que enche conforme a rolagem real da página.
- **Estudos de caso** que abrem e fecham, terminal interativo e animações sutis de entrada.

### Dados salvos no navegador do visitante

| Chave (`localStorage`) | Conteúdo |
| --- | --- |
| `lulu-portfolio-theme` | `light` ou `dark` |
| `lulu-portfolio-visitor-name` | nome informado na janela de boas-vindas |
| `lulu-portfolio-welcome-seen` | `1` depois que a janela foi respondida |

Para rever a janela de boas-vindas como se fosse a primeira visita, abra as ferramentas do navegador (F12), vá em **Application → Local Storage** e apague essas chaves (ou use uma janela anônima).

## 1. Instalar as dependências

Requer [Node.js](https://nodejs.org/) 18 ou superior.

```bash
npm install
```

## 2. Executar localmente

```bash
npm run dev
```

Abra o endereço mostrado no terminal (normalmente http://localhost:5173). Para testar a versão final:

```bash
npm run build
npm run preview
```

## 3. Publicar no GitHub

1. Crie um repositório vazio em https://github.com/new (sem README, sem .gitignore).
2. Na pasta do projeto, rode:

```bash
git init
git add .
git commit -m "Primeira versão do portfólio"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
git push -u origin main
```

## 4. Conectar à Vercel

1. Entre em https://vercel.com e faça login com sua conta do GitHub.
2. Clique em **Add New… → Project** e escolha o repositório.
3. A Vercel detecta o Vite sozinha. Confirme: Build Command `npm run build` e Output Directory `dist`.
4. Clique em **Deploy**. Em instantes o site estará em um endereço `.vercel.app`.
5. Para usar domínio próprio: **Settings → Domains** no projeto da Vercel.

## 5. Fazer futuras atualizações

```bash
# edite os arquivos, teste com npm run dev, depois:
git add .
git commit -m "Descreva a mudança"
git push
```

Cada `git push` na branch `main` gera um novo deploy automático na Vercel.

## Estrutura

```
index.html                  conteúdo e estrutura das seções
src/style.css               identidade visual (paleta e tipografia no topo, em :root;
                            o tema escuro redefine as variáveis em html[data-theme="dark"])
js/app.js                   todo o JavaScript, em um único arquivo clássico, dividido
                            em blocos comentados (tema, navegação, boas-vindas, bateria,
                            infinito elástico, revelações, estudos de caso, terminal)
assets/                     favicon e foto
vite.config.js              copia js/app.js para a versão publicada
```

## Acessibilidade

Navegação por teclado com foco visível, link "Ir para o conteúdo", marcação semântica, menus e estudos de caso com `aria-expanded`, janela de boas-vindas com `<dialog>` (foco preso e `Esc`), bateria com `role="progressbar"` e descrição para leitores de tela, contraste verificado nos dois temas e respeito à preferência de movimento reduzido do sistema (animações, infinito elástico e revelações são desligados).

## Abrir sem servidor

Como o JavaScript é um arquivo clássico e os caminhos são relativos, o `index.html` também funciona com duplo clique (útil para uma prévia rápida). Para desenvolver, prefira `npm run dev`. As fontes do Google só carregam com internet; sem ela, o site usa fontes do sistema.
