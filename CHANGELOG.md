# Histórico de versões — GALACTIC-DEFENDER

## [0.17.2] — Mira automática sem disparo automático

### Corrigido
- A mira mobile continua acompanhando o inimigo ativo mais próximo, mas não dispara por conta própria.
- O disparo no celular agora depende exclusivamente do botão de disparo, preservando o joystick para movimentação e o arraste para orientar a nave quando não há inimigos.
- Atualiza os identificadores de cache e a versão exibida para `0.17.2`.

### Validação
- Correção registrada; aguarda teste manual no celular para confirmar mira, disparo manual e regressão das mecânicas.

## [0.17.1] — Mira mobile por arraste e disparo automático (candidata em validação)

### Alterado
- Ao arrastar o dedo na arena mobile, a nave acompanha a direção indicada quando não há inimigos ativos.
- Inimigos ativos têm prioridade na mira; o jogo dispara automaticamente contra o inimigo mais próximo.
- Desativada a ação padrão de toque/rolagem na área do canvas para manter o arraste consistente.
- Aguarda validação manual de controle, fluidez e regressão no celular.

## [0.17.0] — Rotação de 360° e mira por plataforma (candidata em validação)

### Em desenvolvimento
- Rotação suave da nave para acompanhar a direção da mira, sem sprites de rotação pré-renderizados.
- No PC, WASD/setas com movimento relativo à orientação da nave, mira pelo mouse e disparo pelo botão direito ou Espaço.
- No mobile, joystick com movimento analógico e mira automática no inimigo ativo mais próximo.
- Candidata integrada em `main` para teste manual; ainda não aprovada. A v0.16.2 permanece como última versão validada.

### Plano de validação
- Confirmar que a nave acompanha a mira sem saltos visuais ou inversões inesperadas.
- Verificar movimento frontal, ré, strafe e diagonais no PC, incluindo disparo simultâneo.
- Verificar joystick, mira automática, disparo e fluidez no celular.
- Fazer regressão do escudo, progressão, inimigos, colisões, pausa e reinício.

## [0.16.2] — Otimização e refinamento do escudo (teste mobile aprovado)

### Corrigido
- Remove `shadowBlur` da barreira persistente e da onda de quebra, evitando o custo elevado do desfoque recalculado a cada quadro.
- Substitui o brilho por contornos e preenchimento translúcido, mantendo a barreira legível com renderização mais simples.
- Refina a onda de quebra com dois anéis leves, preservando o dano em área e a recarga automática.
- Atualiza os identificadores de cache para `0.16.2`.

### Validação
- A v0.16.1 passou nos testes funcionais do escudo informados pelo usuário, mas apresentou queda severa de fluidez após equipar a habilidade no celular.
- Teste manual informado pelo usuário: 6/6 itens aprovados no celular, incluindo fluidez antes/depois de obter o escudo, visual da barreira e barra de integridade, quebra com onda de energia, recarga aproximada de 7 segundos e regressão de movimento, disparo, inimigos e progressão.

## [0.16.1] — Escudo regenerativo

### Alterado
- Substitui o bloqueio por cargas consumíveis por uma barreira de energia visível ao redor da nave.
- Adiciona barra de integridade do escudo e recarga automática após a quebra.
- Ao ser destruída, a barreira libera uma onda de energia que causa dano aos inimigos próximos.
- Melhorias adicionais de escudo aumentam sua integridade máxima até o limite definido.

### Validação
- O usuário confirmou que a barreira, a barra de integridade, a onda de energia e a recarga funcionaram no celular.
- Foi observada uma queda severa de desempenho após equipar o escudo; correção iniciada na v0.16.2.

## [0.16.0] — Progressão em cartas (teste funcional mobile aprovado)

### Adicionado
- Interface de três cartas para escolhas de progressão, com animação de interação e adaptação a telas móveis.
- Melhorias de atributos percentuais: dano da arma, velocidade e integridade máxima.
- Habilidades especiais em marcos da progressão: tiro múltiplo, laser perfurante, escudo de energia e reparo de emergência.
- Cartas de atributos em níveis ímpares a partir do nível 3; cartas especiais a cada cinco níveis. Frequência e valores são provisórios.
- O requisito de XP continua crescendo progressivamente a cada nível.

### Validação
- O usuário confirmou que o menu, a partida, as cartas de atributos e as habilidades especiais funcionaram nos testes mobile. O escudo foi identificado como a única habilidade que precisava de refinamento, tratado na v0.16.1.


Histórico documentado desde os marcos iniciais. Versões em ordem decrescente; quando falta evidência para um marco antigo, isso é informado sem inventar recursos.

## [0.15.1] — Testes manuais em computador e celular aprovados

### Controles de computador
- Adiciona disparo contínuo enquanto o botão direito do mouse estiver pressionado, permitindo mover com WASD ao mesmo tempo.
- Mantém a tecla Espaço como alternativa de disparo.
- Impede que o menu de contexto do navegador abra durante o clique direito na arena.
- Atualiza a versão exibida, identificadores de cache, controles acessíveis e histórico dentro do jogo.
- Teste manual no computador aprovado pelo testador informado pelo usuário: o controle foi considerado bom e não houve bugs reportados.
- Publicação no GitHub Pages concluída com sucesso pelo GitHub Actions.
- Teste manual no celular aprovado conforme informado pelo usuário: joystick virtual e botão de disparo funcionaram normalmente, sem erros reportados.
- Validação manual em computador e celular concluída conforme os relatos recebidos; isso não substitui testes automatizados ou cobertura em vários dispositivos.

## [0.15.0] — Teste no computador aprovado; regressão mobile pendente

### Polimento e consistência
- Atualiza os identificadores de cache para `0.15.0` nos pontos de entrada e módulos que os versionam.
- Melhora a indicação visual de foco para navegação por teclado e respeita a preferência do sistema por movimento reduzido.
- Atualiza a versão exibida, o histórico dentro do jogo e a documentação do projeto.
- Corrige a documentação dos controles para remover a instrução duplicada da tecla Espaço.
- Teste manual no computador aprovado pelo testador informado pelo usuário, sem bugs encontrados.
- Publicação no GitHub Pages concluída com sucesso pelo GitHub Actions.
- Teste de regressão no celular ainda pendente; a validação total da versão depende dessa etapa.

## [0.14.0] — Validada pelo usuário

### Adicionado
- Sistema persistente de conquistas e recordes pessoais, salvo no navegador.
- Conquistas por eliminações, chefes derrotados, missões concluídas, pontuação e ondas alcançadas.
- Painel no menu para consultar conquistas, estatísticas e recordes.

### Correção
- Salva também o recorde da partida quando o jogador retorna ao menu antes da tela de fim de jogo.

## Histórico completo

- **0.13.0:** chefes a cada cinco ondas, disparos direcionados, ajuste dos perseguidores vermelhos e histórico no menu. Teste manual informado aprovado nos sete itens.
- **0.12.0:** escolhas de melhoria ao subir de nível: dano, velocidade ou escudo/reparo; suporte a escolhas acumuladas.
- **0.11.1:** equilíbrio do áudio e controle de volume geral persistido.
- **0.11.0:** música e efeitos sintetizados por Web Audio API; interceptador ciano.
- **0.10.0:** missões rotativas, recompensas de XP/pontuação e títulos de piloto.
- **0.9.2:** manutenção de desempenho e consolidação da versão.
- **0.9.1:** refinamento do feedback de dano e ajustes de arena/HUD.
- **0.9.0:** HUD compacta, faíscas de dano e barras de vida dos inimigos.
- **0.8.0:** lobby, seleção PC/mobile, configurações e inicialização mobile mais segura.
- **0.7.0:** joystick virtual analógico com disparo separado.
- **0.6.0:** arena mobile em paisagem, controles maiores e disparos à distância dos perseguidores.
- **0.5.0:** preparação e documentação dos disparos à distância dos perseguidores; registros descrevem a proposta e o alinhamento dos recursos.
- **0.4.0:** sentinela com IA de combate à distância e projéteis direcionados.
- **0.3.1:** refinamento dos controles de toque e da arena mobile.
- **0.3.0:** perseguição básica, arena mobile ampliada e remoção do dano automático por inimigos que escapavam pela borda.
- **0.2.0:** primeiros controles de toque responsivos e ajustes para celular.
- **0.1.0:** não foi localizado registro separado confiável para atribuir funcionalidades específicas.
- **0.0.0:** marco inicial; não foi localizado registro separado que descreva recursos com segurança.

## Observações
- Atualizar este arquivo e o histórico dentro do jogo juntos.
- A v0.14.0 foi validada pelo usuário. A v0.15.0 foi aprovada no teste manual em computador; a v0.15.1 foi aprovada em computador e celular. A v0.16.2 passou nos seis testes manuais de desempenho e regressão no celular informados pelo usuário. A v0.17.0 foi publicada como candidata em `main`. A v0.17.1 adiciona mira por arraste e disparo automático mobile; aguarda validação manual no celular.
