# GALACTIC-DEFENDER

Jogo de ação espacial para navegador, desenvolvido do zero com HTML, CSS e JavaScript puro.

## Estado do projeto

**Versão:** `0.3.0` — perseguição básica de inimigos e arena mobile ampliada.

**Fase:** primeira inteligência de perseguição, ajuste de controles mobile e expansão da arena em telas estreitas.

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
- Inimigos perseguem a nave com movimento gradual; colisões causam dano à integridade.
- Inimigos não causam dano automático ao ultrapassar a borda da arena.
- Invulnerabilidade temporária com efeito visual de piscar após receber dano.
- XP, níveis, pontuação e missão inicial.
- HUD compacta dentro da arena com integridade, XP, nível, onda e pontuação sempre visíveis.
- Feedback visual de dano e efeito de partículas douradas ao subir de nível.
- Modo de tela cheia com tentativa opcional de bloquear a orientação em paisagem.
- Ondas de inimigos com intervalos e dificuldade progressiva.
- Controles por toque para testar a jogabilidade em telas móveis.

## Desempenho e controles mobile

- Atualização dos indicadores HTML limitada a 10 vezes por segundo, com escrita no DOM somente quando o valor muda.
- Fundo e grade do Canvas desenhados em uma camada em cache, em vez de reconstruídos a cada quadro.
- Densidade de pixels limitada a 1,5 em dispositivos com ponteiro de toque para reduzir o custo de renderização em celulares.
- Efeitos de brilho reduzidos, desfoque de camadas da HUD desativado em dispositivos de toque e animação da chama da nave sem números aleatórios por quadro.
- Os controles de toque foram ampliados para facilitar os comandos em telas pequenas.
- Em telas móveis estreitas, a arena usa uma proporção mais alta para oferecer mais espaço vertical de combate.
- O fundo em cache, a densidade de pixels limitada e os efeitos reduzidos continuam sendo medidas de otimização; o desempenho deve ser validado em dispositivos reais.

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
