# GALACTIC-DEFENDER

Jogo de ação espacial para navegador, desenvolvido do zero com HTML, CSS e JavaScript puro.

## Estado do projeto

**Fase:** protótipo jogável com combate e ondas em desenvolvimento.

- Plataforma principal: computador, com controles de teclado.
- Compatibilidade inicial: navegadores modernos com suporte a Canvas e ES Modules.
- Publicação: GitHub Pages via GitHub Actions.
- Estrutura modular, sem frameworks ou dependências externas.

## Executar localmente

Como o projeto usa módulos JavaScript, abra a pasta com um servidor HTTP local (por exemplo, a extensão Live Server do VS Code). Abrir `index.html` diretamente como `file://` pode bloquear os módulos.

## Controles

- `WASD` ou setas: mover a nave.
- `Espaço`: disparar.
- `P`: pausar ou retomar.

## Mecânicas atuais

- Movimento da nave e disparo de projéteis.
- Inimigos com colisões e dano à integridade.
- Invulnerabilidade temporária com efeito visual de piscar após receber dano.
- XP, níveis, pontuação e missão inicial.
- Ondas de inimigos com intervalos e dificuldade progressiva.

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
