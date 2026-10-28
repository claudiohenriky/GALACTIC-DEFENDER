# GALACTIC-DEFENDER

Jogo de ação espacial para navegador, desenvolvido do zero com HTML, CSS e JavaScript puro.

## Estado do projeto

**Versão em preparação:** `0.6.0` — ataques dos perseguidores a maior distância e layout horizontal mobile com arena ampliada e controles de toque maiores. Os URLs dos arquivos estáticos e módulos continuam versionados para evitar reutilização de recursos antigos em cache.

**Fase:** expansão da IA inimiga e dos padrões de combate.

- Plataforma: navegadores modernos em computador e celular.
- Controles: teclado para movimentação, mouse para mirar e botões de toque em dispositivos compatíveis. A mira por mouse foi integrada em `main` e aguarda validação manual no computador.
- Tela cheia: botão no canto superior da arena; em celulares, a orientação horizontal é recomendada.
- Compatibilidade inicial: navegadores modernos com suporte a Canvas e ES Modules.
- Publicação: GitHub Pages via GitHub Actions.
- Estrutura modular, sem frameworks ou dependências externas.

## Executar localmente

Como o projeto usa módulos JavaScript, abra a pasta com um servidor HTTP local (por exemplo, a extensão Live Server do VS Code). Abrir `index.html` diretamente como `file://` pode bloquear os módulos.

## Controles

- `WASD` ou setas: mover a nave.
- `Mouse`: mirar; `Espaço`: disparar na direção da mira.
- `Espaço`: disparar.
- `P`: pausar ou retomar (teclado).
- Celular: use as setas na tela para mover e o botão **DISPARAR** para atirar.

## Mecânicas atuais

> **Validação pendente:** a mira pelo mouse, os novos disparos dos perseguidores e os ajustes de layout horizontal e controles mobile foram integrados na branch de trabalho e aguardam revisão; a versão `0.6.0` deve ser testada no GitHub Pages antes de ser considerada validada. Os URLs do CSS, do ponto de entrada e de cada módulo incluem o identificador da versão para forçar o navegador a buscar os arquivos atualizados.

- Movimento da nave e disparo de projéteis.
- Inimigos perseguidores avançam diretamente contra a nave; colisões causam dano à integridade.
- A partir da onda 2, alguns inimigos sentinelas tentam manter distância e disparam projéteis direcionados à posição da nave no momento do disparo.
- Projéteis dos sentinelas causam 10 pontos de dano em impacto direto e respeitam a invulnerabilidade temporária.
- A partir da onda 3, perseguidores também podem disparar projéteis mais lentos, causando de 3 a 5 pontos de dano conforme o tamanho do inimigo; o disparo exige distância e tem intervalo longo.
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
- Os controles de toque receberam um novo aumento de área de acionamento, com ajuste específico para telas estreitas e orientação horizontal.
- Em telas móveis estreitas, a arena usa proporção `10:19` para oferecer mais espaço vertical de combate sem alterar a escala lógica do jogo.
- O fundo em cache, a densidade de pixels limitada e os efeitos reduzidos continuam sendo medidas de otimização; o desempenho deve ser validado em dispositivos reais.

## Organização

- `src/core/`: ciclo principal, estado do jogo e gerenciador de ondas.
- `src/player/`: nave do jogador.
- `src/enemies/`: lógica de inimigos.
- `src/combat/`: projéteis do jogador, projéteis inimigos e colisões.
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
