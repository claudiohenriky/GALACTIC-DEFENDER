# Arquitetura do GALACTIC-DEFENDER

O protótipo usa JavaScript moderno com ES Modules, sem bibliotecas externas.

## Responsabilidades

- `main.js`: ponto de entrada e ligação dos eventos de teclado e toque.
- `src/core/game.js`: estado global, ciclo de animação, geração e colisões.
- `src/core/wave-manager.js`: contagem de inimigos por onda, intervalos e escalada de dificuldade.
- `src/player/player.js`: movimento, integridade, invulnerabilidade temporária e desenho da nave.
- `src/enemies/enemy.js`: movimento de perseguição, comportamento de sentinelas, disparos e desenho dos inimigos.
- `src/combat/projectile.js`: projéteis do jogador.
- `src/combat/enemy-projectile.js`: projéteis inimigos direcionados à posição da nave no disparo.
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
- Os inimigos perseguidores avançam gradualmente na direção da nave; a velocidade escala moderadamente com a onda.
- A partir da onda 2, uma parcela dos inimigos pode surgir como sentinela: tenta manter uma faixa de distância e dispara projéteis em direção à posição atual da nave no momento do disparo.
- Projéteis hostis são removidos ao sair da arena e respeitam a janela de invulnerabilidade. Sentinelas causam 10 de dano; perseguidores podem disparar a partir da onda 3, causando 3–5 de dano, com menor velocidade e intervalo mais longo.
- Sair da borda não causa dano automático. O dano acontece por colisão direta com a nave; uma futura base defensiva deverá ter sistema de vida próprio.
- Em telas móveis estreitas, a proporção `10:19` aumenta o espaço vertical da arena; botões de toque ampliados têm ajustes separados para telas estreitas e orientação horizontal.
- Teclado e controles de toque compartilham o mesmo conjunto de entradas; os controles de toque aparecem em dispositivos com ponteiro de toque.

## Desempenho do Canvas

- O fundo e a grade estáticos são pré-renderizados em um canvas auxiliar e reutilizados durante os quadros da partida.
- A escala de pixels do Canvas é limitada a 1,5 em dispositivos com ponteiro de toque e a 2 em outros dispositivos para controlar o custo de renderização.
- A HUD HTML atualiza no máximo a cada 100 ms durante a partida e evita reescrever texto ou largura quando os valores não mudaram.
- Brilhos de nave, inimigos e projéteis foram reduzidos; a chama da nave usa uma oscilação determinística em vez de gerar aleatoriedade a cada quadro.
- Essas mudanças são hipóteses de otimização e precisam ser verificadas em dispositivos reais; não representam garantia universal de FPS.

## Auditoria de desempenho — v0.18.0

- O ciclo principal permanece em `src/core/game.js`; a reestruturação deve ocorrer em etapas, sem reescrita integral nem mudança de comportamento não planejada.
- As verificações de colisão usam comparações de distância ao quadrado quando só precisam saber se dois objetos estão dentro de um raio combinado. Isso evita raízes quadradas em verificações frequentes sem alterar o critério geométrico pretendido.
- A seleção da mira automática compara distâncias ao quadrado, pois a ordenação das distâncias é a mesma sem calcular a raiz quadrada.
- As listas de partículas, efeitos, projéteis e inimigos são compactadas com índices de escrita no próprio array, evitando alocar arrays substitutos por quadro. A ordem dos elementos mantidos é preservada.
- Essas alterações reduzem operações matemáticas e alocações explícitas no ciclo, mas não provam, por si só, melhoria perceptível de FPS. A validação depende de medição e de teste em dispositivos reais.
- Próximo alvo: medir o custo do ciclo principal e revisar responsabilidades de game.js; qualquer extração de módulos deve ser feita isoladamente para facilitar a detecção de regressões.

## Próximas validações

1. Confirmar carregamento de todos os módulos em HTTP/HTTPS.
2. Verificar movimento, disparo, colisões, integridade, invulnerabilidade e reinício.
3. Confirmar que as ondas aguardam todos os inimigos e avançam após o intervalo.
4. Testar pausa/retomada e comportamento ao mudar de aba.
5. Testar HUD, feedback de dano, partículas de nível e tela cheia em diferentes tamanhos de tela.
6. Testar o ritmo de disparo, a colisão e a dificuldade dos projéteis de sentinelas e perseguidores em computador e celular.
7. Balancear a velocidade de perseguição e a dificuldade conforme o comportamento observado em dispositivos reais.
8. Evoluir missões, recompensas e títulos depois que o ciclo principal estiver estável.
