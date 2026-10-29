## [0.24.2] — Ajuste fino da elasticidade inimiga

### Ajustes visuais
- Reduz discretamente o alongamento longitudinal, a expansão lateral e o cisalhamento dos cascos inimigos para evitar uma sensação excessivamente molenga.
- Preserva a leitura de movimento responsiva e as correções de trajetória do chefe da v0.24.1.
- Não altera IA, padrões de perseguição, mira, dano, integridade ou cadência de disparos.

### Validação
- Verificações automatizadas e teste manual no GitHub Pages ainda precisam ser confirmados após a publicação.

## [0.24.1] — Polimento do movimento inimigo e correção do chefe

### Correções e ajustes
- Reforça a resposta visual elástica dos cascos inimigos com alongamento sutil, inclinação lateral e propulsão proporcional ao movimento, inspirados na nave do jogador.
- Corrige a trajetória do chefe da onda 5: ele avança para uma faixa de combate mais próxima do jogador e percorre um destino horizontal suave, em vez de oscilar pela velocidade sinusoidal e ficar junto à borda.
- Mantém a lógica de mira dos disparos, dano, integridade e demais regras de combate.

### Validação
- Verificações automatizadas e teste manual desta correção ainda precisam ser executados. Validar pelo GitHub Pages em celular, especialmente o movimento do chefe na onda 5 e a fluidez com vários inimigos.

## [0.24.0] — Movimento fluido dos inimigos

### Movimento e leitura visual
- Adiciona rotação e inclinação suaves orientadas pela velocidade real de cada inimigo, seguindo o princípio visual já usado pela nave do jogador.
- Adiciona propulsão e brilhos laterais leves em Canvas 2D, sem sprites pré-renderizados, motor 3D ou dependências externas.
- Interceptadores fazem curvas laterais durante a perseguição; sentinelas percorrem uma faixa de tiro; perseguidores mantêm desvios controlados; chefes preservam sua faixa e varredura horizontal.
- Mantém os valores de dano, integridade e os disparos direcionados existentes; os tiros continuam mirando a posição do jogador no momento do disparo.

### Validação
- Candidata em pull request. Verificações automatizadas e teste manual pelo GitHub Pages ainda precisam ser confirmados; computador não foi testado nesta etapa.

# Histórico de versões — GALACTIC-DEFENDER

## [0.23.0] — Resposta visual da nave ao movimento

### Movimento e propulsão
- Faz a chama do propulsor aumentar durante a movimentação e diminuir suavemente quando o jogador para.
- Adiciona um brilho lateral discreto que acompanha a intensidade do deslocamento.
- Mantém a inclinação pseudo-3D existente e não altera a física, a mira, os disparos, os atributos ou o balanceamento.

### Compatibilidade
- Mantém o Canvas 2D e não adiciona frameworks ou dependências externas.
- Ajusta os identificadores de cache e a versão exibida para `0.23.0`.

### Validação
- Alterações preparadas em branch e submetidas para revisão; requer teste manual no GitHub Pages em celular e computador. Não afirmar validação visual antes do teste.

## [0.22.0] — Hangar e identidade visual das naves

### Hangar e seleção
- Adiciona uma tela de hangar entre o menu principal e a preparação da missão.
- Permite selecionar e salvar localmente três cascos visuais: Vanguard, Phantom e Aegis.
- Mantém os atributos de combate iguais entre os cascos nesta primeira etapa, sem introduzir vantagens de balanceamento ocultas.

### Arte e movimento
- Renova o desenho da nave do jogador com painéis de casco, núcleo, propulsores e uma inclinação lateral pseudo-3D de baixo custo.
- Renova as silhuetas inimigas com detalhes angulares de uma facção hostil, preservando os tipos e a lógica de combate atuais.
- Melhora a acessibilidade dos botões da preparação em tela cheia em telas móveis baixas, permitindo rolagem e respeitando áreas seguras.

### Validação
- Revisão estática concluída; o workflow automatizado do pull request passou nas verificações de sintaxe JavaScript, imports relativos e whitespace.
- A validação visual real ainda depende do teste do usuário pelo GitHub Pages em celular; computador permanece não testado.

## [0.20.0] — Notificações compactas de recompensa

### Interface
- Move as notificações de missão, recompensa, conquista e chefe para o lado direito da arena, com entrada e saída horizontais.
- Reduz largura, tamanho de texto e altura; o detalhe é limitado a três linhas para diminuir a sobreposição da HUD.
- Ajusta o posicionamento especificamente para celular na horizontal, mantendo a região esquerda da HUD mais livre.

### Validação
- Revisão estática concluída; o comportamento visual precisa ser confirmado pelo usuário no GitHub Pages, principalmente em celular na horizontal.


## [0.19.2] — Dano da explosão do escudo

### Corrigido
- Aumenta o dano da onda de quebra contra chefes para 12 pontos, tornando o impacto perceptível na barra de vida.
- Mantém o dano da explosão contra inimigos comuns em 2 pontos.
- Preserva a correção da v0.19.1: o contato com o escudo não aniquila inimigos automaticamente.
- Atualiza os identificadores de cache e a versão exibida para `0.19.2`.

### Validação
- Aguardando teste manual do usuário no GitHub Pages, com foco no dano da explosão contra o chefe da onda 5 e na regressão do contato com inimigos comuns.

## [0.19.1] — Correção de colisão do escudo e otimização de renderização

### Corrigido
- O escudo não elimina inimigos automaticamente ao absorver uma colisão; chefes deixam de poder ser destruídos instantaneamente só por encostar na nave.
- Adiciona intervalo de contato por inimigo para evitar que uma sobreposição consuma toda a integridade do escudo em poucos quadros.
- Remove sombras desfocadas repetidas da nave e dos inimigos para reduzir trabalho de renderização durante partidas movimentadas.
- Atualiza os identificadores de cache e a versão exibida para `0.19.1`.

### Validação
- Correção baseada na reprodução relatada pelo usuário e em revisão estática do código.
- Ainda requer teste manual no GitHub Pages para confirmar o comportamento do escudo, especialmente contra o chefe da onda 5, e a frequência das travadinhas.


## [0.19.0] — Progressão de XP e recompensas ao vivo

### Progressão e recompensas
- Ajusta o XP por tipo de inimigo: perseguidores 20 XP, interceptadores 15 XP, sentinelas 35 XP e chefes 180 XP.
- Troca o crescimento exponencial do requisito de nível por uma curva linear: 100 XP para o nível 2, aumentando 35 XP por nível seguinte.
- Adiciona uma faixa animada dentro da arena para comunicar missões concluídas, XP/pontos recebidos, novos títulos, conquistas desbloqueadas (incluindo marcos de pontuação/ondas) e derrotas de chefes.
- Atualiza os identificadores de cache e a versão exibida para `0.19.0`.

### Validação
- Alterações revisadas estaticamente; ainda não foram testadas manualmente no GitHub Pages.
- A versão foi mesclada na `main`; a validação manual dos recursos e do equilíbrio foi feita pelo usuário, que reportou os bugs de colisão do escudo e travadinhas tratados na candidata v0.19.1.

## [0.18.1] — Ajuste pontual na renderização do escudo (candidata em validação)

### Otimização
- Agrupa o desenho da barreira e da barra do escudo em uma única seção de estado do Canvas.
- Desenha a barreira em coordenadas da arena, removendo a translação de contexto por quadro sem mudar a geometria, as cores ou a lógica de integridade/recarga.
- Mantém a onda de quebra, o dano em área e a recarga automática inalterados.
- Atualiza o identificador de cache do módulo principal do jogo e a versão exibida.

### Validação
- Alteração candidata baseada em revisão estática do código; o ganho de desempenho ainda não foi medido.
- Aguarda validação manual pelo usuário no GitHub Pages antes de integrar em `main`.

## [0.18.0] — Otimização do núcleo e do Canvas 2D (aprovada após teste manual)

### Otimizações iniciais
- Substitui cálculos de distância com `Math.hypot()` por comparações com distâncias ao quadrado nas verificações frequentes de colisão entre projéteis, inimigos e jogador, além da área de impacto do escudo.
- A seleção do inimigo mais próximo compara distâncias ao quadrado, evitando raízes quadradas que não são necessárias para ordenar distâncias.
- Remove cálculos redundantes das coordenadas da boca da arma antes do laço de criação dos projéteis; as coordenadas necessárias continuam sendo calculadas para cada projétil.
- Compacta as listas de partículas, efeitos, projéteis e inimigos no próprio array, evitando criar novos arrays com `.filter()` a cada quadro.
- Adiciona diagnóstico opcional do ciclo por `?profile=1`, com tempos médios de atualização/renderização, intervalo de quadros e contagem de entidades.
- Adiciona validação automática de sintaxe JavaScript e caminhos de imports relativos nos pull requests.
- Atualiza os identificadores de cache e a versão exibida para `0.18.0`.

### Validação
- O usuário testou a versão publicada no GitHub Pages e informou que o jogo funcionou corretamente; percebeu uma pequena melhora subjetiva, especialmente ao usar o escudo.
- Não foram recolhidos resultados comparativos de FPS em dispositivos reais; nenhum ganho quantificado é afirmado.
- A investigação do escudo continua na v0.18.1.


## [0.17.3] — Retorno frontal da nave no mobile

### Alterado
- Quando não há inimigos ativos e o jogador solta o toque na arena, a nave retorna suavemente à direção frontal padrão.
- O arraste continua permitindo orientar manualmente a nave quando não há inimigos; a mira automática continua priorizando o inimigo ativo mais próximo.
- O disparo permanece manual, acionado pelo botão DISPARAR.
- Atualiza os identificadores de cache, a versão exibida e o histórico do jogo.

### Validação
- Versão aprovada pelo usuário após teste manual no celular; retorno frontal, mira, disparo e movimentação foram considerados corretos.

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
