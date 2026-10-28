# GALACTIC-DEFENDER

Jogo de ação espacial para navegador, desenvolvido do zero com HTML, CSS e JavaScript puro.

## Estado do projeto

**Versão:** `0.2.0` — protótipo jogável com controles de teclado e toque.

**Fase:** otimização do ciclo de renderização e validação de desempenho em dispositivos móveis.

- Plataforma: navegadores modernos em computador e celular.
- Controles: teclado no computador e botões de toque na arena em dispositivos compatíveis.
- Tela cheia: botão no canto superior da arena; em celulares, a orientação horizontal é recomendada.
- Compatibilidade inicial: navegadores modernos com suporte a Canvas e ES Modules.
- Publicação: GitHub Pages via GitHub Actions.
- Estrutura modular, sem frameworks ou dependências externas.

## Executar localmente

Como o projeto usa módulos JavaScript, abra a pasta com um servidor HTTP local (por exemplo, a extensão Live Server do VS Code). Abrir `index.html` diretamente como `file://` pode bloquear os módulos.

## Controles

- `WASD` ou setas: mover a nave.
- `Espaço`: disparar.
- `P`: pausar ou retomar (teclado).
- Celular: use as setas na tela para mover e o botão **DISPARAR** para atirar.

## Mecânicas atuais

- Movimento da nave e disparo de projéteis.
- Inimigos com colisões e dano à integridade.
- Invulnerabilidade temporária com efeito visual de piscar após receber dano.
- XP, níveis, pontuação e missão inicial.
- HUD compacta dentro da arena com integridade, XP, nível, onda e pontuação sempre visíveis.
- Feedback visual de dano e efeito de partículas douradas ao subir de nível.
- Modo de tela cheia com tentativa opcional de bloquear a orientação em paisagem.
- Ondas de inimigos com intervalos e dificuldade progressiva.
- Controles por toque para testar a jogabilidade em telas móveis.

## Otimização em andamento

- Atualização dos indicadores HTML limitada a 10 vezes por segundo, com escrita no DOM somente quando o valor muda.
- Fundo e grade do Canvas desenhados em uma camada em cache, em vez de reconstruídos a cada quadro.
- Densidade de pixels limitada a 1,5 em dispositivos com ponteiro de toque para reduzir o custo de renderização em celulares.
- Efeitos de brilho reduzidos e animação da chama da nave sem números aleatórios por quadro.
- A meta desta etapa é reduzir travamentos sem remover mecânicas; a melhoria precisa ser confirmada por testes no aparelho, pois o desempenho varia por navegador e dispositivo.

## Ponto de atenção conhecido

- A integridade também perde 8 pontos quando um inimigo atravessa toda a arena e sai pela parte inferior. O jogo agora sinaliza visualmente o dano, mas a regra de balanceamento poderá ser revisada depois.

## Organização

- `src/core/`: ciclo principal, estado do jogo e gerenciador de ondas.
- `src/player/`: nave do jogador.
- `src/enemies/`: lógica de inimigos.
- `src/combat/`: projéteis e colisões.
- `src/progression/`: experiência e evolução.
- `src/missions/`: objetivos e recompensas.
- `src/ui/`: HUD e interface.
- `docs/`: documentação técnica.

## Princípios de desenvolvimento

1. Implementar e validar uma mudança lógica por vez.
2. Usar commits pequenos, descritivos e consistentes.
3. Testar o carregamento e o jogo após mudanças estruturais.
4. Manter `main` como versão oficial.
5. Nunca incluir tokens, senhas ou credenciais no repositório.

## GitHub Pages

O workflow em `.github/workflows/deploy.yml` publica o conteúdo do repositório quando há push em `main`. Em **Settings → Pages**, selecione **GitHub Actions** como fonte de build, se ainda não estiver selecionada.
