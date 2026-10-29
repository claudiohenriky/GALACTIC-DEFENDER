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
- `src/progression/progression.js`: experiência, níveis, curva de XP e classes de piloto.
- `src/missions/missions.js`: progresso de objetivo e estado de conclusão.
- `src/ui/hud.js`: atualização dos indicadores da página e da HUD compacta dentro da arena.
- `main.js`: também controla a entrada e saída da tela cheia, com tentativa opcional de orientar o celular na horizontal.

## Estado da versão

- A candidata v0.21.0 adiciona uma tela de preparação antes da partida; o loop de jogo só começa após confirmação explícita. A v0.20.0 compacta as notificações de recompensa no lado direito da arena.
- A v0.19.2 ajusta o dano da onda de quebra do escudo contra chefes (12 pontos), mantendo 2 pontos contra inimigos comuns.
- A confirmação manual da candidata v0.20.0 é feita pelo usuário no GitHub Pages, com foco em celular na horizontal.

## Decisões técnicas

- Canvas 2D para a arena, com desenho escalável por densidade de pixels.
- HTML para menus e interface acessível; CSS para apresentação responsiva.
- A HUD da arena mostra integridade e XP durante a partida, inclusive em tela cheia.
- A faixa de recompensas ao vivo usa HTML/CSS fora do Canvas para comunicar conclusão de missões, XP/pontos, novos títulos, conquistas e chefes sem desenhar texto a cada quadro.
- O dano confirmado ativa um aviso visual temporário; subir de nível ativa um aviso e partículas douradas no Canvas.
- Tela cheia é iniciada por ação explícita do jogador; pode ser ativada na preparação antes de começar ou dentro da arena. O bloqueio de orientação horizontal é opcional, pois depende do navegador/dispositivo.
- A tela de preparação é independente do ciclo de jogo e não deve iniciar ondas, áudio ou movimento antes de `INICIAR MISSÃO`.
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

## Auditoria de desempenho — v0.18.0 e v0.18.1

- O ciclo principal permanece em `src/core/game.js`; a reestruturação deve ocorrer em etapas, sem reescrita integral nem mudança de comportamento não planejada.
- As verificações de colisão usam comparações de distância ao quadrado quando só precisam saber se dois objetos estão dentro de um raio combinado. Isso evita raízes quadradas em verificações frequentes sem alterar o critério geométrico pretendido.
- A seleção da mira automática compara distâncias ao quadrado, pois a ordenação das distâncias é a mesma sem calcular a raiz quadrada.
- As listas de partículas, efeitos, projéteis e inimigos são compactadas com índices de escrita no próprio array, evitando alocar arrays substitutos por quadro. A ordem dos elementos mantidos é preservada.
- Essas alterações reduzem operações matemáticas e alocações explícitas no ciclo, mas não provam, por si só, melhoria perceptível de FPS. A validação depende de medição e de teste em dispositivos reais.
- O diagnóstico opcional `?profile=1` registra intervalos de quadro, tempo de atualização, tempo de renderização e contagens de entidades em lotes de 180 quadros. Ele tem custo de instrumentação e serve para comparação aproximada, não como benchmark científico.
- `game.js` ainda concentra atualização, colisões, efeitos e desenho. Não foi extraído um renderer nesta etapa porque mover o desenho de uma só vez teria risco de regressão sem testes de navegador; a próxima refatoração deve separar uma responsabilidade por vez, começando por desenho ou colisões após os resultados do profiler.
- Na v0.18.1, `drawShield()` agrupa a barreira e a barra de integridade em uma única seção `save/restore` e usa coordenadas absolutas, removendo uma translação de contexto por quadro. É uma otimização pequena e conservadora; sua eficácia ainda precisa de validação no navegador.
- Próximo alvo após validar a correção do escudo: voltar ao plano de evolução estrutural incremental e escolher uma extração pequena de `game.js`, sem reescrita ampla do renderer. Medições do profiler podem ajudar quando estiverem acessíveis.

## Correção candidata v0.19.1

- Colisões com a nave usam um intervalo de contato por inimigo. Com o escudo ativo, o contato consome carga sem remover automaticamente o inimigo; a explosão de quebra continua sendo a mecânica separada de dano em área.
- Removidos os efeitos de sombra desfocada por quadro da nave e dos inimigos como tentativa conservadora de reduzir picos de renderização. O resultado precisa ser comparado no navegador real.

## Próximas validações

1. Confirmar carregamento de todos os módulos em HTTP/HTTPS.
2. Verificar movimento, disparo, colisões, integridade, invulnerabilidade e reinício.
3. Confirmar que as ondas aguardam todos os inimigos e avançam após o intervalo.
4. Testar pausa/retomada e comportamento ao mudar de aba.
5. Testar HUD, feedback de dano, partículas de nível e tela cheia em diferentes tamanhos de tela.
6. Testar o ritmo de disparo, a colisão e a dificuldade dos projéteis de sentinelas e perseguidores em computador e celular.
7. Balancear a velocidade de perseguição e a dificuldade conforme o comportamento observado em dispositivos reais.
8. Evoluir missões, recompensas e títulos depois que o ciclo principal estiver estável.
