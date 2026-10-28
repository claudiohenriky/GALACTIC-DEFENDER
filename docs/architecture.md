# Arquitetura inicial

O protótipo usa JavaScript moderno com ES Modules, sem bibliotecas externas.

## Responsabilidades

- `main.js`: ponto de entrada e ligação dos eventos de teclado e toque.
- `src/core/game.js`: estado global, ciclo de animação, geração e colisões.
- `src/core/wave-manager.js`: contagem de inimigos por onda, intervalos e escalada de dificuldade.
- `src/player/player.js`: movimento, integridade, invulnerabilidade temporária e desenho da nave.
- `src/enemies/enemy.js`: movimento de perseguição, limites da arena e desenho dos inimigos.
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
- Os inimigos perseguem gradualmente a posição atual da nave; a velocidade escala moderadamente com a onda.
- Sair da borda não causa dano automático. O dano acontece por colisão direta com a nave; uma futura base defensiva deverá ter sistema de vida próprio.
- Em telas móveis estreitas, a proporção `10:19` aumenta o espaço vertical da arena; botões de toque ampliados têm ajustes separados para telas estreitas e orientação horizontal.
- Teclado e controles de toque compartilham o mesmo conjunto de entradas; os controles de toque aparecem em dispositivos com ponteiro de toque.

## Desempenho do Canvas

- O fundo e a grade estáticos são pré-renderizados em um canvas auxiliar e reutilizados durante os quadros da partida.
- A escala de pixels do Canvas é limitada a 1,5 em dispositivos com ponteiro de toque e a 2 em outros dispositivos para controlar o custo de renderização.
- A HUD HTML atualiza no máximo a cada 100 ms durante a partida e evita reescrever texto ou largura quando os valores não mudaram.
- Brilhos de nave, inimigos e projéteis foram reduzidos; a chama da nave usa uma oscilação determinística em vez de gerar aleatoriedade a cada quadro.
- Essas mudanças são hipóteses de otimização e precisam ser verificadas em dispositivos reais; não representam garantia universal de FPS.

## Próximas validações

1. Confirmar carregamento de todos os módulos em HTTP/HTTPS.
2. Verificar movimento, disparo, colisões, integridade, invulnerabilidade e reinício.
3. Confirmar que as ondas aguardam todos os inimigos e avançam após o intervalo.
4. Testar pausa/retomada e comportamento ao mudar de aba.
5. Testar HUD, feedback de dano, partículas de nível e tela cheia em diferentes tamanhos de tela.
6. Balancear a velocidade de perseguição e a dificuldade conforme o comportamento observado em dispositivos reais.
7. Evoluir missões, recompensas e títulos depois que o ciclo principal estiver estável.
