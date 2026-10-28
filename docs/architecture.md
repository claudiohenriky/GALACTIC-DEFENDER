# Arquitetura inicial

O protótipo usa JavaScript moderno com ES Modules, sem bibliotecas externas.

## Responsabilidades

- `main.js`: ponto de entrada e ligação dos eventos da página.
- `src/core/game.js`: estado global, ciclo de animação, geração e colisões.
- `src/core/wave-manager.js`: contagem de inimigos por onda, intervalos e escalada de dificuldade.
- `src/player/player.js`: movimento, integridade, invulnerabilidade temporária e desenho da nave.
- `src/enemies/enemy.js`: movimento e desenho dos inimigos.
- `src/combat/projectile.js`: projéteis do jogador.
- `src/progression/progression.js`: experiência, níveis e classes de piloto.
- `src/missions/missions.js`: progresso de objetivo e estado de conclusão.
- `src/ui/hud.js`: atualização dos indicadores na interface.

## Decisões técnicas

- Canvas 2D para a arena, com desenho escalável por densidade de pixels.
- HTML para menus e interface acessível; CSS para apresentação responsiva.
- `requestAnimationFrame` com delta time limitado para reduzir saltos após quedas de FPS.
- O sistema de ondas é separado do ciclo principal para facilitar balanceamento e expansão.
- A lógica inicial prioriza teclado e desktop; a adaptação para controles móveis será tratada separadamente após os testes básicos.

## Próximas validações

1. Confirmar carregamento de todos os módulos em HTTP/HTTPS.
2. Verificar movimento, disparo, colisões, integridade, invulnerabilidade e reinício.
3. Confirmar que as ondas aguardam todos os inimigos e avançam após o intervalo.
4. Testar pausa/retomada e comportamento ao mudar de aba.
5. Evoluir missões, recompensas e títulos depois que o ciclo principal estiver estável.
