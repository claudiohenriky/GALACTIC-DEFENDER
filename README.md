# GALACTIC-DEFENDER

**Versão 1.0.0 — lançamento estável**

GALACTIC-DEFENDER é um jogo de ação espacial para navegador, desenvolvido com HTML, CSS e JavaScript modular. A renderização principal usa Canvas 2D; um pipeline opcional de pós-processamento WebGL adiciona efeitos visuais configuráveis.

- **Jogar:** https://claudiohenriky.github.io/GALACTIC-DEFENDER/
- **Código-fonte:** https://github.com/claudiohenriky/GALACTIC-DEFENDER

## Conteúdo do jogo

- Quatro naves jogáveis: Vanguard, Phantom, Aegis e Wraith.
- Hangar com perfis de nave e personalização visual por sessão.
- Habilidades de classe, melhorias durante a partida, árvore de pesquisa e missões rotativas.
- Conquistas e recordes da sessão.
- Inimigos comuns e Elite, asteroides interativos e o chefe Encouraçado com apresentação cinematográfica.
- Música, efeitos sonoros e comunicações sintetizados localmente com Web Audio API.
- Controles para computador e dispositivos móveis.

### Nave especial Wraith

A Wraith é desbloqueada pelo código de aliado `ORBITAL-ALLY`. O código precisa ser inserido novamente a cada sessão. Como o jogo é executado no navegador e o código-fonte é público, esse código funciona como um desbloqueio de conveniência, não como mecanismo de segurança.

## Estado e privacidade local

A versão 1.0.0 não grava progresso ou preferências no navegador. Nível, XP, missões, conquistas, recordes, árvore de pesquisa, nave selecionada, personalização, desbloqueio da Wraith e configurações existem apenas na sessão atual.

Ao recarregar ou fechar a página, o jogo volta ao estado inicial. Na primeira abertura da v1.0.0, dados antigos do jogo com prefixo `gd-` são removidos de `localStorage` e `sessionStorage`; outras chaves do navegador não são alteradas.

## Gráficos

O pós-processamento WebGL é opcional e começa desligado para priorizar desempenho em celulares. As configurações incluem:

- **Desligado:** Canvas 2D sem pós-processamento.
- **Baixo:** gradação de cor e vinheta, conforme os controles individuais.
- **Médio:** libera também linhas de varredura.
- **Alto:** libera todos os efeitos, incluindo aberração cromática.

Gradação de cor, vinheta, linhas de varredura e aberração cromática possuem controles individuais. Se WebGL não estiver disponível, o jogo continua com a renderização Canvas 2D.

## Controles

### Computador
- `WASD` ou setas: movimentação.
- Mouse: mirar.
- Botão direito (segurar) ou `Espaço`: disparar.
- `P`: pausar/retomar.
- `F`: habilidade ativa da classe.

### Celular
- Joystick virtual: movimentação analógica em 360°.
- Botão **DISPARAR**: disparo contínuo.
- Mira automática nos inimigos; arraste na arena para orientar a nave quando aplicável.
- Recomenda-se jogar na orientação horizontal e usar tela cheia.

## Executar localmente

O projeto usa ES Modules. Sirva a pasta por HTTP com uma ferramenta como Live Server no VS Code ou outro servidor estático. Abrir o arquivo diretamente por `file://` pode bloquear imports de módulos.

Não há framework nem dependência de runtime externa.

## Estrutura

- `src/core/`: ciclo principal, câmera, ondas e preparação da sessão.
- `src/player/`: nave e classes do jogador.
- `src/enemies/` e `src/ai/`: inimigos, chefe e comportamento tático.
- `src/combat/`: projéteis, mísseis e colisões.
- `src/progression/`: XP, árvore de pesquisa, títulos e conquistas.
- `src/missions/`: objetivos e recompensas.
- `src/environment/`: ambiente espacial e asteroides.
- `src/audio/`: música e efeitos sintetizados.
- `src/rendering/`: pós-processamento WebGL opcional.
- `src/ui/`: HUD, diálogos, retratos e interface.
- `tests/`: testes automatizados.
- `docs/`: documentação técnica e validação de desempenho.

## Validação e publicação

O workflow `.github/workflows/validate.yml` verifica sintaxe JavaScript, testes automatizados, imports relativos e whitespace em pull requests e pushes para `main`.

O workflow `.github/workflows/deploy.yml` publica automaticamente o conteúdo de `main` no GitHub Pages. A fonte de publicação em **Settings → Pages** deve ser **GitHub Actions**.

Consulte [CHANGELOG.md](./CHANGELOG.md) para o histórico de versões e [docs/performance-testing.md](./docs/performance-testing.md) para o protocolo de medição. Resultados automatizados não substituem a validação manual em celular e computador.
