## [0.44.0] — Primeiro chefe: nave de guerra pesada (em desenvolvimento)

- Amplia a escala física do chefe e introduz uma silhueta de nave de guerra com blindagem, núcleo e módulos visíveis.
- Adiciona dez módulos independentes de armamento: metralhadoras, lançadores de mísseis, lasers leves, canhões de plasma, canhão principal e sistema auxiliar.
- Implementa estados de módulo: operacional, danificado, inoperante e destruído; inclui sinais visuais iniciais de fumaça, fogo e faíscas.
- Adiciona escudos regionais frontais, laterais e traseiro, com recarga condicionada ao sistema auxiliar.
- Integra padrões de disparo por categoria de armamento, com projéteis leves de pressão, mísseis lentos e canhões de plasma de alto impacto.
- Ao atingir 33% de casco, o chefe inicia uma única transformação de sobrecarga, reconstrói/substitui módulos e retorna com 50% de integridade.
- Primeira aparição alterada para a onda 10; recorrência nas ondas 15, 20, 25...
- Implementa entrada cinematográfica com aproximação suavizada, anel de detecção, bloqueio temporário dos disparos e zoom dinâmico de câmera com compensação da mira por mouse/toque.
- Corrige a contenção vertical da nave durante a entrada e a inicialização da classificação de ondas de chefe no spawn.
- Expande o mundo físico para 1,6× a largura e a altura do viewport, com câmera de acompanhamento, limites próprios e conversão de mira por mouse/toque.
- Ajusta o spawn de inimigos e a entrada/patrulha do chefe à região visível da câmera; projéteis, mísseis e separação usam os limites do mundo.
- Corrige a faixa lateral do Artilheiro para acompanhar a posição do jogador e o posicionamento vertical do chefe para continuar visível quando o combate ocorre perto do limite inferior da arena.
- Reforça a identidade de encouraçado: reposicionamento lento e limitado, rotação gradual de 0,85 rad/s e hitbox de colisão ampliada para acompanhar a silhueta blindada, permitindo ao jogador flanquear e atacar os setores regionais.
- Amplia os gatilhos da validação automatizada para executar também na branch candidata e em PRs direcionadas à base de desenvolvimento; a validação inclui sintaxe JS, resolução de imports relativos e whitespace do diff.
- Validação automatizada aprovada no HEAD atual: sintaxe de todos os módulos JavaScript, resolução dos imports relativos e verificação de whitespace do diff.
- Mantém o cache do fundo limitado ao tamanho do viewport para evitar multiplicar o consumo de memória pela expansão do mundo.
- Ainda pendentes: arte final em pixel art, efeitos avançados, sequência de destruição, refinamentos de HUD, balanceamento, auditoria estática completa e testes de navegador/desempenho.
- Candidata em desenvolvimento; não mesclada em `main`.

## [0.43.0] — Evolução da IA inimiga (candidata)

- Rebalanceia a Sentinela normal: esquiva menos frequente e menos intensa, com deslocamento lateral mais contido e reposicionamento menos agressivo.
- Promove a Sentinela de Elite: esquiva mais longa e forte, recarga menor, curvas laterais mais amplas e reposicionamento mais responsivo; mantém a salva dupla de plasma.
- Diferencia o Artilheiro de Elite: esquiva lateral mais forte, leque mais concentrado, disparos mais rápidos e ligeiro aumento de dano/velocidade; preserva o escudo de 8 pontos.
- Evita varrer projéteis durante a recarga da esquiva, reduzindo trabalho repetido sem alterar a janela de reação.
- Mantém as fases, movimentação e padrões de ataque dos chefes fora do escopo desta atualização.
- Candidata em desenvolvimento; requer revisão estática e validação natural de gameplay. Não mesclada em `main`.

## [0.42.1] — Guardião de Elite: Égide de Proteção (candidata)

- Guardião de Elite mantém o posicionamento frontal e recebe aumento moderado de integridade (+2 pontos sobre o Guardião normal), além do escudo individual de 12 pontos.
- Adiciona uma segunda barreira compartilhada de 18 pontos que envolve até duas tropas atribuídas ao Guardião de Elite.
- A barreira absorve dano destinado às tropas protegidas; quando esgotada, o dano volta a atingir a integridade da tropa.
- Cada Guardião, normal ou Elite, recebe no máximo duas tropas exclusivas; uma tropa não é atribuída simultaneamente a vários Guardiões.
- Guardiões de Elite recebem prioridade na distribuição; Sentinelas só usam a cobertura do Guardião que realmente as recebeu como alvo.
- O escudo externo é finito e não se regenera nesta versão; sem invulnerabilidade permanente.
- Candidata para teste manual; não mesclada em `main`.

## [0.42.0] — Identidade Elite e Guardião de Elite (candidata)

- Restaura o Artilheiro de Elite com casco predominantemente preto e detalhes verdes, mantendo o escudo de 8 pontos.
- Diferencia mais a silhueta da Sentinela de Elite, preservando sua salva dupla de plasma e seu papel de combate à distância.
- Adiciona o Guardião de Elite a partir da onda 16, com placas defensivas próprias, 12 pontos de escudo e função de proteção de aliados preservada.
- Remove os nomes flutuantes sobre as tropas; a primeira aparição de cada classe Elite em uma partida gera um aviso de ameaça na interface, apenas quando a unidade realmente surge.
- Substitui a entrada atual por uma distorção espacial breve, feita com poucos traços e sem sistema de partículas.
- Aplica uma barra de integridade mais larga e destacada às variantes Elite.
- A queda de FPS relatada permanece como investigação separada; esta candidata não declara a otimização como resolvida.
- Candidata para teste manual; não mesclada em `main`.

## [0.41.0] — Segunda Tropa de Elite: Sentinela de Elite (candidata)

- Generaliza a identificação de variantes Elite para Artilheiro e Sentinela, sem criar uma nova classe-base.
- Introduz a Sentinela de Elite ocasionalmente a partir da onda 14, preservando sua movimentação lateral, reposicionamento e mira.
- Adiciona uma salva dupla de plasma: dois projéteis ligeiramente divergentes, com dano individual reduzido e dano total próximo ao disparo normal da Sentinela.
- Diferencia a variante com placas escuras, casco roxo, núcleo luminoso azul-claro e identificação temporária na entrada.
- Mantém o escudo de 8 pontos exclusivo do Artilheiro de Elite; a Sentinela de Elite não recebe esse escudo.
- Concede pontuação de Elite sem alterar XP, vida ou dano de contato.
- Candidata para teste manual; desempenho, frequência de aparição e legibilidade ainda precisam de validação. Não mesclada em `main`.

## [0.40.1] — Ajustes nas Tropas de Elite (patch)

- Refina o Artilheiro de Elite: roxo predominante, placas pretas e detalhes verdes discretos.
- Substitui o anel completo de escudo por segmentos leves, mantendo os 8 pontos de absorção de dano.
- Adiciona efeito de entrada simples e identificação temporária `ARTILHEIRO DE ELITE`, sem partículas extras.
- Ajusta a movimentação evasiva do Artilheiro de Elite com deslocamento lateral inspirado na Sentinela, porém mais contido.
- Faz o Guardião priorizar tropas de Elite ativas antes de Sentinelas ao escolher quem proteger.
- Otimização visual direcionada; a causa exata da queda de FPS ainda depende de validação no dispositivo do usuário.
- Candidata para teste geral posterior; não validada manualmente e não mesclada em `main`.

## [0.40.0] — Primeira Tropa de Elite: Artilheiro de Elite (candidata)

- Adiciona o Artilheiro de Elite como variante do Artilheiro existente, não como uma quinta classe.
- Introduz a variante ocasionalmente a partir da onda 12, preservando o surgimento normal de chefes e classes.
- Diferencia o casco com armadura escura, detalhes roxos e núcleo verde.
- Adiciona escudo de energia visível que absorve dano antes da integridade do casco; dano excedente atinge a vida normalmente.
- Mantém o padrão de movimento e leque de disparos do Artilheiro-base nesta primeira prova de conceito.
- Candidata para teste manual; ainda não validada pelo usuário e não mesclada em `main`.

## [0.39.0] — Cooperação tática entre Guardião e Sentinela

- Guardiões próximos a Sentinelas passam a buscar uma posição de cobertura entre a unidade aliada e o jogador.
- Sentinelas próximas a um Guardião ajustam gradualmente seu posicionamento para aproveitar a cobertura e manter uma linha de tiro.
- A cooperação é apenas de posicionamento nesta primeira etapa; não transfere dano, não cria invulnerabilidade e não altera vida, dano, cadência ou regras de colisão.
- Candidata experimental; verificar se a formação é legível, se não causa agrupamento/oscilação e se o desempenho permanece estável.

## [0.38.0] — Esquivas mais legíveis e separação entre inimigos

- Aumenta moderadamente o deslocamento lateral de esquiva para sentinelas, artilheiros e chefe; mantém janelas curtas e recargas por classe, sem invulnerabilidade.
- Adiciona separação suave entre inimigos próximos para reduzir a sobreposição de cascos, distribuindo o deslocamento conforme o tamanho relativo das unidades.
- Preserva os padrões de mira, disparos, vida, dano e surgimento das classes.
- Candidata para teste manual; ainda não validada em jogo real nem mesclada em `main`.

## [0.37.0] — Percepção de projéteis e esquivas limitadas

- A IA de sentinelas, artilheiros e chefes estima a aproximação de projéteis do jogador com velocidade relativa e distância prevista de maior aproximação.
- Introduz esquivas curtas com intensidade e intervalo de reação específicos por classe; os inimigos não ficam invulneráveis e não reagem a todos os disparos.
- A lógica recebe os projéteis ativos já existentes e não altera dano, vida, cadência de disparo nem regras de colisão.
- Candidata experimental: requer validação manual de comportamento, dificuldade, fluidez e regressões. Não mesclada em `main`.

## [0.36.0] — Fundação da IA: orientação tática

- Separa a orientação visual da nave da direção do movimento para sentinelas, artilheiros e chefe.
- Essas classes podem reposicionar-se mantendo o armamento apontado ao jogador, evitando mostrar a traseira enquanto disparam para ele.
- Não altera dano, integridade, cadência nem regras de projéteis.
- **Validação manual:** aprovado pelo jogador na prévia; relatou melhora muito significativa, orientação natural e maior agressividade das Sentinelas. Testes completos de artilharia, chefe e outros dispositivos ainda são recomendados.
- Próxima etapa planejada: percepção de ameaças e esquivas controladas de projéteis.

## [0.35.0] — Laser Contínuo e decisões iniciais de Attack Clash

- Adiciona Laser Contínuo como habilidade especial independente, preservando os Tiros Perfurantes de Plasma.
- O feixe direcional causa dano sustentado e, ao cruzar um projétil inimigo, inicia uma decisão de Attack Clash.
- Opções: forçar vitória (dano bônus e maior sobrecarga), sustentar empate (menor custo) ou escapar (sem dano bônus, com recarga maior).
- O laser gera sobrecarga progressiva, tem eficiência reduzida quando o sistema está quente e pode ser interrompido pelo bloqueio crítico.
- **Validação manual pendente:** alcance, controles, decisões, balanceamento e desempenho em celular/computador.

## [0.34.0] — Attack Clash e correção de contato com o chefe

- Adiciona a primeira interação direta entre projéteis: tiros da nave e projéteis inimigos se neutralizam quando suas áreas colidem.
- Corrige um defeito de contato: o chefe não é mais desativado instantaneamente quando a nave encosta nele sem escudo; o dano de contato ao jogador permanece.
- Mantém a lógica de dano aos inimigos separada da neutralização entre projéteis.
- **Validação pendente:** testar tiros contra projéteis inimigos, tiros perfurantes, chefe com vida cheia, dano por contato e FPS em celular e computador.

## [0.33.0] — Fundação compartilhada de colisões

- Adiciona `src/combat/collision.js` com testes geométricos reutilizáveis para áreas circulares e segmentos varridos.
- Centraliza os testes circulares de tiro do jogador contra inimigos, mísseis contra inimigos, contato entre inimigos e nave, e projéteis inimigos contra a nave.
- Preserva a política de dano, perfuração, repulsão e destruição existente; esta etapa não ativa confrontos entre projéteis.
- **Validação pendente:** revisar os imports e testar manualmente as colisões existentes em celular e computador. Attack Clash continua para a etapa seguinte.

## [0.32.0] — Chefe com fases de combate

- Introduz três fases para o chefe atual, acionadas ao atingir 66% e 33% de integridade.
- Fase 1 mantém o disparo único original; fase 2 usa uma salva de três projéteis; fase 3 usa cinco projéteis em leque, com dano individual reduzido.
- As transições recebem uma pausa curta e um contorno visual para sinalizar a mudança de padrão.
- O chefe ganha movimento lateral mais intenso na fase final; demais classes e regras de colisão permanecem no sistema existente.
- **Validação pendente:** executar teste manual no celular, confirmar transições, legibilidade dos padrões, dano, FPS e regressões. A branch oficial `main` não foi alterada.

## [0.31.0] — Nova classe: Artilheiro

- Adiciona o Artilheiro a partir da onda 4, exceto nas ondas de chefe.
- O Artilheiro mantém uma faixa de tiro distante, desloca-se lateralmente e dispara uma salva de três projéteis em leque.
- Diferencia visualmente a classe com casco violeta; cada derrota concede 150 pontos e 55 XP.
- Mantém os padrões das classes existentes e limita a probabilidade inicial do Artilheiro a 12% por surgimento elegível.
- **Teste manual concluído pelo usuário:** surgimento, leitura visual, leque, equilíbrio, desempenho percebido e regressão das classes existentes aprovados. Não equivale a benchmark de FPS em todos os dispositivos; a versão oficial `main` não foi alterada.

## [0.30.4] — Pulso de Ruptura com plasma leve

- Remove o preenchimento translúcido que pintava uma grande região do campo de jogo ao ativar o Pulso de Ruptura.
- Mantém o contorno semicircular e substitui o preenchimento por três traços neon de baixa opacidade, sugerindo plasma/fumaça com menos trabalho de preenchimento.
- Preserva a velocidade gradual, o alcance, a neutralização de projéteis e a repulsão existentes.
- A redução real de FPS precisa ser medida no dispositivo móvel; a alteração visual diminui a área preenchida, mas não garante sozinha um ganho específico.

## [0.30.3] — Escudo reativo e tiros perfurantes de plasma

- O escudo mantém a proteção lógica de 360°, mas só desenha pequenos arcos na direção de projéteis com trajetória de colisão provável.
- A detecção de ameaças é limitada a uma verificação a cada 80 ms e reutiliza oito setores angulares para evitar um efeito por projétil.
- Remove a camada azul contínua sobre a nave; a barra de integridade do escudo continua disponível.
- Pulso de Ruptura percorre a mesma distância em uma animação mais gradual, com faixa de colisão ligeiramente mais larga.
- Renomeia a habilidade para Tiros Perfurantes de Plasma; o comportamento de perfuração existente é preservado.
- O custo real de FPS e a resposta visual ainda precisam ser confirmados em dispositivo móvel.

## [0.30.2] — Correções de HUD e otimização de efeitos

- Reposiciona o medidor de sobrecarga para o canto superior esquerdo, abaixo da HUD principal e fora da área do joystick.
- Reposiciona o contador de FPS abaixo da área das notificações superiores para evitar sobreposição com conquistas.
- Torna o medidor térmico mais legível, com estados curtos e porcentagem explícita.
- Substitui as faíscas de superaquecimento por fumaça discreta somente após permanência no estado crítico.
- Reserva faíscas de dano para integridade igual ou inferior a 35%, limita a quantidade e reduz o custo visual de cada partícula.
- Requer teste manual para medir a melhora real de FPS; não foi executado teste de jogo no navegador.

## [0.30.1] — Patch de otimização, pulso semicircular e diagnóstico de FPS

### Escudo e Pulso de Ruptura
- Simplifica a oscilação visual do escudo normal para reduzir trabalho de renderização.
- Substitui a barreira retangular por uma frente semicircular de 180°, com alcance ampliado para 480 unidades.
- Prioriza a neutralização de projéteis e reduz o dano direto aos inimigos; a repulsão aumenta conforme o nível do escudo e é reduzida contra chefes.
- Limita os testes de colisão à faixa semicircular recém-varrida, usando distância ao quadrado e produto escalar para evitar cálculos angulares repetidos.
- Aumenta o custo de sobrecarga do pulso para 38.

### Sobrecarga e resposta a impactos
- Desacelera moderadamente a recuperação térmica: 10/s em estado estável, 6/s sob sobrecarga e 16/s durante o bloqueio crítico.
- Move o medidor térmico para um painel vertical independente no canto inferior esquerdo, com cores e alertas progressivos.
- Adiciona faíscas esparsas e limitadas quando a nave permanece em sobrecarga crítica.
- Aplica recuo curto e amortecido quando o casco recebe dano ou o escudo absorve um impacto.

### Diagnóstico de desempenho
- Adiciona a opção **Medidor de FPS** às configurações. Quando ativada, exibe FPS estimado e duração média de quadro, atualizados duas vezes por segundo.
- O medidor é opcional e permanece desativado por padrão para evitar atualizações de interface desnecessárias.
- A medição representa a cadência de quadros observada pelo navegador, não uma medição isolada de GPU.

### Validação
- Candidata para teste manual; main permanece inalterada.
- Ainda é necessário confirmar a jogabilidade, o comportamento de repulsão e o desempenho real no celular. A medição de FPS será usada para comparar situações normais e o uso do Pulso de Ruptura.

## [0.30.0] — Pulso de Ruptura, sobrecarga e fragmentação de mísseis

### Escudo de emergência
- A antiga Onda do Escudo foi substituída pelo **Pulso de Ruptura**, disponível somente enquanto o escudo estiver quebrado.
- O pulso percorre a direção atual da nave como uma barreira frontal ampla, neutralizando projéteis e causando dano controlado uma única vez por inimigo atingido.
- A onda automática da quebra do escudo permanece separada; o pulso tem recarga própria.

### Energia e sobrecarga
- Adiciona medidor de energia térmica compartilhado por disparos de laser, mísseis e Pulso de Ruptura.
- A partir de 70%, as habilidades ficam menos eficazes e a nave perde velocidade.
- Ao atingir 100%, as habilidades especiais ficam bloqueadas temporariamente; a nave desacelera até a recuperação.
- A energia recupera-se gradualmente. Os valores iniciais ainda precisam de balanceamento manual.

### Mísseis
- O lançamento seleciona os dois alvos mais próximos sem ordenar toda a lista de inimigos.
- Mísseis de nível 3 se fragmentam em até três projéteis teleguiados mais fracos, com limite de entidades para controlar o custo de renderização.

### Validação
- Candidata para teste manual; não mesclada em `main`.
- O workflow `Validate project` passou nas verificações de sintaxe JavaScript, imports relativos e whitespace para a revisão de código verificada. Testes reais de jogabilidade, equilíbrio e desempenho continuam necessários.

## [0.29.1] — Diagnóstico e otimização de desempenho

### Desempenho
- Instrumentação opcional por `?profile=1` para separar custos de atualização, renderização e ativação de habilidades.
- Lançamento de mísseis passa a selecionar até dois alvos próximos sem ordenar a lista inteira de inimigos.
- Esta candidata ainda precisa de teste real em dispositivos; não há alegação de FPS melhorado sem medições.

## [0.29.0] — Reestruturação do escudo e otimização de combate

### Escudo de energia
- Redesenha a barreira com silhueta angular e renderização mais simples.
- Adiciona a Onda do Escudo, ativável pelo botão ou pela tecla Q após desbloquear a carta de escudo.
- A onda remove projéteis inimigos próximos e causa dano controlado em inimigos dentro do alcance; o nível aumenta o alcance e reduz a recarga.
- A quebra passiva do escudo continua emitindo sua onda curta e preserva a recarga automática.
- A interação com feixes contínuos e ataques especiais de bosses fica planejada para a etapa futura de colisões; esses tipos de ataque ainda não existem como entidades de combate.

### Desempenho
- Remove filtros de desfoque caros dos mísseis e projéteis inimigos.
- Limita o número de efeitos simultâneos de explosão/onda.
- Atualiza os estados visuais dos botões junto da atualização da HUD, em vez de alterar o DOM a cada quadro.
- Remove a renderização síncrona completa disparada no instante da ativação do míssil.

### Validação
- Candidata em feature/v0.29.0-shield-rework-performance; main permanece inalterada.
- A validação estática e o teste automatizado serão executados antes da prévia. Desempenho real e equilíbrio ainda precisam de teste manual em celular.

## [0.28.6] — Candidata: carta de míssil disponível para validação

### Correção de seleção
- A carta **Míssil teleguiado** passa a ser incluída garantidamente nas escolhas de habilidade especial enquanto a habilidade estiver abaixo do nível máximo (3).
- As outras duas cartas da seleção continuam sendo sorteadas conforme seus pesos de raridade.
- O ajuste foi usado apenas para diagnóstico. Após a confirmação do usuário de que os mísseis estão visíveis e funcionais, a distribuição ponderada original das cartas especiais foi restaurada na v0.29.0.

### Estado e validação
- Candidata de diagnóstico substituída pela v0.29.0; não foi mesclada separadamente em `main`.
- O usuário confirmou que o desenho dos mísseis nas pontas da nave ficou correto. O teste completo de desempenho da candidata v0.29.0 ainda está pendente.

## [0.28.5] — Candidata: lançamento visível pelas asas

### Correções de lançamento
- Corrige a ordem de renderização: os mísseis são desenhados depois da nave para não ficarem escondidos pelo casco durante a saída.
- Calcula o ponto de lançamento usando a mesma rotação e inclinação lateral (bank) do desenho da nave.
- Exibe dois suportes visuais de míssil nas asas quando a habilidade está equipada e pronta; eles somem durante a recarga.
- No nível 2+, lança primeiro o míssil da asa direita e, 0,2 segundo depois, o da esquerda. A perseguição e a atribuição de alvos existentes são preservadas.
- Reduz a frequência e o tamanho dos rastros e evita criar arrays/sets temporários a cada atualização para reduzir custo em celulares.

### Estado e validação
- Candidata na branch feature/v0.28.5-visible-wing-launch; não mesclada em main.
- A validação automatizada de sintaxe/imports e o teste manual de lançamento em celular ainda precisam ser confirmados. Verificar suportes, os dois disparos, alvos, dano, recarga e fluidez.

## [0.28.4] — Candidata: mísseis duplos nas asas

### Jogabilidade
- Lança os dois mísseis a partir de pontos laterais alinhados às asas da nave, usando a rotação atual para calcular a posição corretamente.
- Com pelo menos dois inimigos ativos, atribui alvos distintos aos mísseis; com apenas um inimigo, ambos podem persegui-lo.
- Quando um alvo deixa de existir, tenta escolher um alvo ainda não reservado pelo outro míssil antes de compartilhar o mesmo alvo.
- Aplica separação de trajetória quando os mísseis se aproximam e adiciona rastros curtos e leves para tornar cada percurso mais visível.

### Estado e validação
- Candidata na branch feature/v0.28.4-dual-wing-missiles; não mesclada em main.
- Verificações estáticas não substituem o teste manual no celular. Confirmar lançamento nas duas asas, seleção de alvos, separação visual, dano e recarga.

## [0.28.3] - Candidata mobile

- Atualiza o estado do botao de habilidade durante a recarga.
- Ativa a habilidade no inicio do toque para reduzir atraso.
- Separa a trajetoria dos dois misseis no nivel 2+.
- Reposiciona o botao para longe dos controles inferiores e compacta avisos em paisagem.
- Ainda precisa de teste manual no celular; nao mesclada em main.

## [0.28.2] — Candidata: confiabilidade do míssil e interface compacta

### Correções
- A ativação não depende mais de haver inimigos ativos exatamente no instante do toque; o míssil pode adquirir um alvo quando ele aparecer.
- A partir do nível 2, são criados dois mísseis mesmo quando ambos precisam perseguir o mesmo inimigo.
- Atualiza o estado do botão ao iniciar/retomar e impede que o clique da habilidade interfira com outros controles.

### Interface
- Reduz o botão, o ícone e os textos, com ajuste específico para telas móveis.
- Mantém o indicador de recarga e melhora a área de toque.

### Estado e validação
- Candidata na branch `feature/v0.28.2-missile-reliability`; não mesclada em `main`.
- Verificações estáticas não substituem o teste manual de disparo no celular.

## [0.28.1] — Candidata: habilidade de míssil ativável e ajustes visuais

### Jogabilidade
- Substitui o disparo automático por ativação manual da habilidade de míssil, por botão na arena ou tecla E.
- Adiciona recarga longa: 12 segundos no nível 1, 10 segundos no nível 2 e 9 segundos no nível 3.
- A partir do nível 2, a ativação lança até dois mísseis teleguiados.
- Aumenta o tamanho dos mísseis e adiciona explosão com dano em área ao atingir inimigos.

### Interface
- Adiciona uma carta de habilidade na arena com estado disponível/recarga e indicador visual.
- Destaca as raridades Comum, Raro, Épico e Lendário com cores próprias nas cartas.
- Atualiza identificadores de cache e histórico de versões.

### Estado e validação
- Candidata em `feature/v0.28.1-activated-missiles`; não mesclada em `main`.
- Efeitos sonoros e polimento de áudio permanecem para uma etapa posterior.
- Requer teste manual no celular pelo link de prévia direta antes de mesclar.

## [0.28.0] — Candidata: míssil teleguiado e raridade das habilidades

### Habilidades especiais
- Adiciona o Míssil teleguiado, que persegue inimigos ativos e causa dano em colisão direta.
- O míssil possui três níveis, com dano, velocidade e cadência de disparo ajustados por nível.
- Introduz raridades visuais Comum, Raro e Épico e pesos de seleção para as cartas de habilidade especial.
- A raridade altera a probabilidade relativa de seleção; não garante que uma carta apareça em toda escolha.

### Estado e validação
- Candidata em `feature/v0.28.0-guided-missile-rarity`; não mesclada em `main`.
- Requer verificações automatizadas e teste manual pelo GitHub Pages antes da publicação.

## [0.27.0] — Nova classe de inimigo: Guardião

### Combate e ondas
- Introduz o Guardião a partir da onda 3, com casco maior, integridade elevada e deslocamento mais lento.
- O Guardião não dispara à distância: sua função é pressionar o jogador pela resistência e pelo avanço constante.
- Concede 180 pontos e 45 XP ao ser derrotado.
- Preserva as classes existentes e os chefes que surgem a cada cinco ondas.

### Validação
- Aguardando verificações automatizadas do pull request e teste manual no GitHub Pages.

## [0.26.0] — Novas cartas de atributos de combate

### Atributos da nave
- Adiciona **Projéteis acelerados**: aumenta em 15% a velocidade dos projéteis normais por nível, até três níveis.
- Adiciona **Controle de propulsão**: aumenta em 8% a aceleração da nave por nível, até três níveis, sem elevar sua velocidade máxima.
- A aceleração é aplicada de forma gradual para preservar a sensação de controle; a nova carta melhora a resposta de aceleração sem alterar a cadência ou o dano.
- As duas cartas são removidas das escolhas quando atingem seus limites. Habilidades especiais existentes permanecem separadas dos atributos.

### Validação
- Aguardando verificações automatizadas do pull request e teste manual pelo GitHub Pages em celular e computador.

## [0.25.0] — Nova carta de atributo: cadência de disparo

### Progressão e combate
- Adiciona a carta **Cadência aprimorada**, que aumenta em 10% a cadência de disparo por escolha, limitada a cinco níveis.
- Reduz o intervalo entre disparos sem alterar dano por projétil, mira, controles ou comportamento dos inimigos.
- Remove a carta da lista de opções quando o limite de cinco níveis é atingido.

### Validação
- A carta foi integrada à `main`; a validação manual pelo GitHub Pages deve ser confirmada pelo usuário.

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
