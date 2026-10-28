# Arquitetura inicial

O protótipo usa JavaScript moderno com ES Modules, sem bibliotecas externas.

## Responsabilidades

- `main.js`: ponto de entrada e ligação dos eventos de teclado e toque.
- `src/core/game.js`: estado global, ciclo de animação, geração e colisões.
- `src/core/wave-manager.js`: contagem de inimigos por onda, intervalos e escalada de dificuldade.
- `src/player/player.js`: movimento, integridade, invulnerabilidade temporária e desenho da nave.
- `src/enemies/enemy.js`: movimento e desenho dos inimigos.
- `src/combat/projectile.js`: projéteis do jogador.
- `src/progression/progression.js`: experiência, níveis e classes de piloto.
- `src/missions/missions.js`: progresso de objetivo e estado de conclusão.
- `src/ui/hud.js`: atualização dos indicadores da página e da HUD compacta dentro da arena.
- `main.js`: também controla a entrada e saída da tela cheia, com tentativa opcional de orientar o celular na horizontal.

## Decisões técnicas

- Canvas 2D para a arena, com desenho escalável por densidade de pixels.
- HTML para menus e interface acessível; CSS para apresentação responsiva.
- A HUD da arena mostra integridade e XP durante a partida, inclusive em tela cheia.
- O dano confirmado ativa um aviso visual temporário; subir de nível ativa um aviso e partículas douradas no Canvas.
- Tela cheia é iniciada por ação explícita do jogador; o bloqueio de orientação horizontal é opcional, pois depende do navegador/dispositivo.
- Controles de toque usam Pointer Events e reutilizam as mesmas entradas lógicas do teclado, permitindo movimento simultâneo e disparo.
- `requestAnimationFrame` com delta time limitado para reduzir saltos após quedas de FPS.
- O sistema de ondas é separado do ciclo principal para facilitar balanceamento e expansão.
- Teclado e controles de toque compartilham o mesmo conjunto de entradas; os controles de toque aparecem em dispositivos com ponteiro de toque.

## Próximas validações

1. Confirmar carregamento de todos os módulos em HTTP/HTTPS.
2. Verificar movimento, disparo, colisões, integridade, invulnerabilidade e reinício.
3. Confirmar que as ondas aguardam todos os inimigos e avançam após o intervalo.
4. Testar pausa/retomada e comportamento ao mudar de aba.
5. Testar HUD, feedback de dano, partículas de nível e tela cheia em diferentes tamanhos de tela.
6. Revisar o feedback de dano quando inimigos escapam pela borda inferior; agora a perda é sinalizada visualmente.
7. Evoluir missões, recompensas e títulos depois que o ciclo principal estiver estável.
