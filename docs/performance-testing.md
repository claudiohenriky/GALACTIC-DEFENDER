# Validação de desempenho — GALACTIC-DEFENDER

Esta rotina compara versões no mesmo dispositivo e cenário. Verificações estáticas não substituem testes reais no navegador.

## Diagnóstico opcional

1. Abra a branch de prévia pelo navegador e acrescente `?profile=1` ao endereço.
2. Inicie uma partida e jogue por pelo menos 30 segundos.
3. No console do navegador, procure `[GALACTIC-DEFENDER profile]` para obter intervalo médio entre quadros, FPS estimado, tempos de atualização/renderização e contagens de entidades.
4. Ao ativar mísseis ou o Pulso de Ruptura, procure `[GALACTIC-DEFENDER activation]`, que informa duração síncrona e quantidade de entidades verificadas.
5. Compare a mesma versão de navegador, orientação, aparelho e cenário; faça três rodadas e use a mediana.

## Limites

- O profiler só roda com `?profile=1` e acrescenta custo de medição.
- A duração de ativação não mede sozinha os quadros seguintes nem prova melhoria de FPS.
- Não declare ganhos medidos sem dados reais. Registre travamentos, erros, aquecimento e alterações nos controles.
- Confirme o comportamento no GitHub Pages em celular e computador antes de aprovar uma candidata.

## Auditoria preparatória — candidata v0.44.0

O foco desta etapa é reduzir custos conhecidos antes de abrir a prévia para o teste de gameplay. As alterações abaixo são otimizações de código, não ganhos de FPS medidos. A rejeição AABB apenas descarta pares cuja distância horizontal ou vertical já é igual/superior à soma dos raios; os pares restantes continuam usando `circlesOverlap` como teste definitivo:

- [x] Seleção do alvo do laser contínuo em uma passagem, sem criar arrays intermediários nem ordenar inimigos.
- [x] Comparações de distância ao quadrado na previsão de esquiva e na separação de mísseis, calculando raiz quadrada somente quando necessária.
- [x] Remover o desfoque de sombra do núcleo do chefe, substituindo-o por camadas sólidas.
- [x] Pré-calcular reservas de alvos dos mísseis guiados uma vez por quadro e reutilizar o conjunto, evitando varrer todos os mísseis para cada inimigo candidato.
- [x] Selecionar os dois aliados de cada Guardião por varredura linear, preservando prioridade de Sentinelas e proximidade sem criar, mapear ou ordenar listas de candidatos.
- [x] Remover também o `filter()`/`sort()` temporário do roster de Guardiões; duas passagens estáveis mantêm Guardiões de Elite primeiro, sem alterar a ordem relativa dentro de cada grupo.
- [x] Remover o `filter()` e os dois `reduce()` da formação de cada Guardião durante a atualização; o centro da formação agora é calculado em uma única passagem, sem array temporário.
- [x] Auditar os pontos de colisão e adicionar rejeição AABB barata antes do teste circular exato em projétil/inimigo, projétil/projétil e míssil/inimigo. A regra final de sobreposição circular e a ordem de resolução foram preservadas.
- [x] Estender a rejeição AABB às colisões de contato inimigo/jogador e projétil inimigo/jogador; o teste circular exato continua decidindo o impacto.
- [x] Auditar a atualização das partículas de dano, partículas de nível e efeitos de quebra de escudo: as listas já são compactadas in-place, sem arrays novos por quadro.
- [x] Remover callbacks `forEach()` do desenho das faíscas/fumaça e partículas de nível; a renderização usa loops indexados no caminho por quadro.
- [x] Cachear a referência estável do gerador auxiliar de escudos no construtor do chefe, removendo a busca `find()` repetida a cada quadro; simplificar a atribuição da recarga para o mesmo valor de 55% (sem alteração de balanceamento).
- [x] Criar índices `Map` estáveis para módulos e setores de escudo do chefe; `getModule()` e `damageShield()` passam a consultar por ID sem percorrer arrays.
- [x] Substituir callbacks `forEach()` na atualização dos mísseis guiados e projéteis inimigos por loops indexados, preservando a ordem e os argumentos de atualização.
- [x] No desenho do chefe, calcular uma vez por quadro os fatores trigonométricos compartilhados pelos módulos danificados e substituir arrays temporários de limites dos arcos de escudo por limites escalares; posições, pulsação, ângulos e aparência permanecem iguais.
- [x] Auditar o ciclo atual de fumaça, fogo, faíscas e escudos do chefe; adicionar faíscas visíveis nos módulos e indicadores de reparo em módulos/escudos, sem criar partículas ou arrays por quadro.
- [x] Corrigir a dissipação de fumaça residual em módulos substituídos: efeitos agora continuam decaindo mesmo depois que o armamento volta ao estado operacional.
- [x] Implementar entrada inicial do chefe com spawn acima da tela, descida suavizada por smoothstep, anel de detecção e bloqueio dos disparos durante a aproximação.
- [x] Adicionar zoom de câmera suave durante encontros com o chefe e converter mira de mouse/toque para coordenadas do mundo.
- [x] Revisar a IA de unidades de longo alcance na arena ampliada: Artilheiro agora mantém sua faixa lateral relativa ao jogador, em vez de convergir para o centro global do mundo.
- [x] Corrigir a posição vertical desejada do chefe para acompanhar a posição do jogador em toda a extensão da arena, sem ficar preso ao meio global do mapa quando o combate ocorre perto do limite inferior.
- [ ] Validar visualmente o zoom em celular e desktop, incluindo mira manual, bordas do cenário e transição após a derrota do chefe.
- [ ] Refinar a arte/variedade dos efeitos e revisar o custo visual com o chefe em combate.
- [ ] Auditar a IA e a separação espacial quando houver muitos inimigos e projéteis simultâneos.
- [x] Conferir alocações temporárias e chamadas caras de Canvas no caminho de renderização: gradiente fica restrito ao cache de resize; não há `shadowBlur` no caminho atual; arrays de rajadas/módulos são montados apenas em eventos de disparo, não em cada quadro.

- [x] Corrigir a contenção vertical genérica que prendia o chefe à borda superior durante a entrada: a nave agora pode permanecer fora da área visível até concluir a aproximação, mantendo o limite horizontal e o limite inferior. Esta é uma correção de lógica/entrada, não uma medição de desempenho.

- [x] Corrigir a ordem de inicialização de `bossWave` no spawn: a classificação da onda agora é calculada antes de determinar a posição inicial, evitando referência à variável antes da declaração no ciclo de criação de inimigos.
- [x] Revisar a separação entre viewport e mundo: referências `this.width/height` restantes em `game.js` pertencem à viewport/câmera/renderização; movimentação, limites e colisões das entidades recebem dimensões do mundo.
- [x] Conferir a conversão inversa `screenToWorld()` para mira por mouse/toque e os limites de câmera em zoom normal e zoom de chefe.

- [x] Ajustar o encouraçado para deslocamento lento e limitado, com rotação gradual (0,85 rad/s), preservando a fantasia de tanque espacial e a oportunidade de atacar os setores laterais/traseiro.
- [x] Criar `collisionRadius` próprio para o boss (1,35× o raio visual), usando-o nos limites físicos, separação e colisões de tiros, mísseis e contato; o raio visual continua controlando a arte e os módulos.
- [x] Garantir que o raio ampliado também seja passado ao teste geométrico exato `circlesOverlap`, não apenas à rejeição rápida por eixos; tiros, mísseis e contato usam o mesmo footprint.

### Cenários de validação após a auditoria

- [ ] Onda comum com quantidade alta de inimigos e projéteis.
- [ ] Chefe da onda 10 com todos os módulos e escudos ativos.
- [ ] Chefe após perder vários armamentos e setores de escudo.
- [ ] Transição de sobrecarga e reconstrução de módulos.
- [ ] Pulso de Ruptura atingindo grupos de inimigos: medir se o recuo não é cancelado pela perseguição e se a IA retoma após a recuperação.
- [ ] Impacto de plasma no jogador: conferir repulsão, aviso de sistemas desestabilizados e recuperação progressiva do controle.
- [ ] Habilidade de mísseis guiados com vários alvos e fragmentação.
- [ ] Comparar três rodadas no mesmo aparelho, navegador, orientação e duração; registrar mediana de FPS, tempo de quadro, atualização e renderização.
- [ ] Confirmar ausência de erros no console e verificar responsividade dos controles.

**Regra de liberação:** não disponibilizar a prévia para o teste principal do chefe antes de concluir a auditoria preparatória e as verificações estáticas. Os cenários acima são executados depois dessa etapa, para identificar o custo real no dispositivo.

## Checklist da candidata v0.29.1

- [ ] Comparar partida leve e partida com muitos inimigos/projéteis.
- [ ] Registrar se há travamento na primeira ativação de habilidade.
- [ ] Observar se a fluidez piora progressivamente durante a partida.
- [ ] Confirmar que os controles continuam responsivos.
- [ ] Não mesclar à `main` sem validação manual e aprovação explícita.


- [x] Seleção do aliado de suporte de Guardião/Sentinela compara distâncias ao quadrado e calcula a raiz apenas uma vez para o aliado escolhido; prioridades e desempate por proximidade permanecem iguais.
- [x] Previsão de esquiva deixa de criar um objeto temporário para cada melhor ameaça; guarda apenas a coordenada horizontal necessária para decidir o lado da manobra.
- [x] Converter os callbacks de renderização de estrelas, projéteis, inimigos, mísseis e efeitos de ruptura em loops indexados, mantendo a ordem de desenho e a lógica de cada elemento.


- [x] Calcular a distância até o jogador apenas nas classes que realmente a consomem (Interceptor, Guardião e perseguidores); Sentinela, Artilharia e chefe mantêm suas rotas próprias sem uma raiz quadrada descartada.
- [x] Na separação entre inimigos, aplicar rejeição pelos eixos antes das multiplicações e do teste de distância ao quadrado; a ordem dos pares e a resolução exata do afastamento permanecem inalteradas.


## Expansão física da arena — candidata v0.44.0

- O mundo de simulação mede 2× a largura e 2× a altura da área visível do Canvas.
- A câmera acompanha suavemente a nave do jogador e respeita os limites do mundo; ao encontrar o chefe, o zoom converge para 0,5 e mantém o enquadramento tático após a derrota até reiniciar a partida.
- Jogador, inimigos, separação espacial, projéteis e mísseis teleguiados usam os limites do mundo expandido; a tela continua sendo apenas a janela de visualização.
- Mouse e toque são convertidos de coordenadas de tela para coordenadas do mundo considerando posição e zoom da câmera.
- Inimigos comuns surgem no topo da área atualmente visível; a entrada do chefe usa o topo da câmera. O encouraçado mantém reposicionamento e rotação deliberadamente lentos, para não espelhar cada movimento do jogador e permitir flanqueamento.
- As estrelas usam coordenadas do mundo; o fundo em grade é cacheado no tamanho do viewport e acompanha a câmera sem criar um bitmap do mundo inteiro.

**Validação pendente:** limites e transformações foram revisados estaticamente; a suíte de sintaxe/imports passou no CI. Ainda é necessário testar gameplay real em celular e desktop. Não há medição de FPS para esta alteração. Verificar principalmente movimentação até as quatro bordas, mira por toque/mouse, entrada do chefe, colisões e limpeza de projéteis.


## Revisão da finalização cinematográfica — 30/10/2026

- A sequência de 8,4 s distribui sete detonações determinísticas ao longo do eixo completo do casco, da proa à seção traseira, em vez de concentrar as explosões na região central.
- O deslocamento visual não aplica mais um segundo offset sobre a posição já integrada no update; isso evita amplificar artificialmente a deriva do destroço.
- Os efeitos continuam usando desenho Canvas determinístico e coordenadas fixas, sem criar arrays ou partículas por quadro.
- CI automatizado valida sintaxe/imports/whitespace, mas não confirma aparência, ritmo cinematográfico ou desempenho real.

## Sequência de destruição do encouraçado — candidata v0.44.0

- Ao chegar a zero de integridade após a transformação de sobrecarga, o chefe entra em estado de destruição e deixa de atacar, receber dano ou servir como alvo de mísseis guiados.
- A sequência dura 8,4 segundos. O casco perde estabilidade, gira e deriva progressivamente pelo espaço enquanto os efeitos de dano já ativos continuam visíveis; a opacidade diminui apenas na parte final da sequência.
- A entidade permanece ativa como destroço visual durante a animação. Ao terminar, é removida e a recompensa é processada uma única vez: pontuação, XP, contador de eliminações, conquistas e progresso de missão.
- Inimigos comuns preservam a remoção e a concessão imediata de recompensas.
- [ ] Testar se o destroço permanece legível durante a deriva e a rotação.
- [ ] Confirmar que projéteis, laser contínuo, contato e mísseis não causam dano adicional durante a destruição.
- [ ] Confirmar uma única concessão de pontuação/XP/conquista/progresso de missão.
- [ ] Confirmar que o zoom tático de 0,5 permanece após a remoção do chefe até reiniciar a partida.
- [ ] Perfil de desempenho no celular e desktop; não há FPS medido nesta revisão.


## HUD tático do chefe — candidata v0.44.0

- [x] Indicadores de casco, quatro escudos e dez módulos atualizados na mesma cadência limitada da HUD existente.
- [x] Atualização dos indicadores usa referências DOM existentes e altera apenas atributos/textos/estilos quando os valores mudam.
- [x] Não há criação de elementos DOM, arrays temporários ou partículas no caminho de atualização do HUD.
- [ ] Verificar legibilidade e sobreposição em telas pequenas, celulares em paisagem e desktop.
- [ ] Conferir em gameplay a transição de escudo operacional para danificado/inoperante e a reconstrução após sobrecarga.
- [ ] Confirmar que o resumo de módulos acompanha corretamente os estados dos dez componentes.

- [x] Indicadores dos dez módulos usam abreviações visíveis (MG, MIS, LAS, PLS, CAN, AUX) em grade 5×2; nomes completos ficam disponíveis em título/rótulo acessível.
- [ ] Verificar que abreviações e estados por cor continuam legíveis em telas de baixa largura e brilho.


### Feedback de combate da HUD tática — candidata v0.44.0

- [x] Comparar os valores atuais com um snapshot anterior por instância de chefe, sem alocar arrays por quadro.
- [x] Aplicar feedback curto somente quando a integridade de um escudo ou módulo muda; dano e recuperação usam sinais visuais distintos.
- [x] Barra de reconstrução utiliza a duração de 4,5 s definida por `BossSystems.beginOverloadRebuild()`.
- [x] Animações são desativadas com `prefers-reduced-motion`.
- [ ] Validar atualização visual, acessibilidade e custo de renderização em dispositivos reais; não há medição de FPS nesta revisão.


### Resolução de dano regional — candidata v0.44.0

- [x] Ataques com coordenadas explícitas preservam o ponto real de impacto.
- [x] Ataques especiais/área sem coordenadas usam a posição do jogador como vetor de origem para selecionar o setor regional, evitando bypass de escudos.
- [x] Snapshot de comparação do HUD é reutilizado por instância de chefe, sem recriar objetos a cada atualização da interface.
- [ ] Testar cada tipo de ataque contra os quatro setores e verificar absorção, dano residual e integridade de módulos em gameplay real.


## Reformulação do encouraçado — alterações estáticas

- [x] Mundo ampliado para 2× a largura e altura do viewport; zoom 0,5 enquadra o mundo completo e permanece ativo após o encontro com o boss até reiniciar a partida.
- [x] Revisar separadamente escala física do mundo e escala de câmera; o zoom completo é calculado a partir da proporção fixa de 2×.
- [x] Representar famílias de armamentos por geometrias distintas de hardpoints, torres, tubos e canos.
- [x] Sobrecarregar módulos de forma adaptativa: intactos permanecem; danificados/inoperantes recebem reparos; destruídos recuperáveis mantêm o tipo original; destruição com dano excedente crítico troca a família da arma.
- [ ] Testar navegação, mira e legibilidade com o mapa completo em celular e desktop.
- [ ] Validar visualmente a classificação de módulos recuperáveis versus irrecuperáveis e o comportamento de disparo após a reconstrução.
- [ ] Medir FPS/tempo de quadro em dispositivos reais; alterações estáticas não constituem medição de desempenho.


## Torres independentes e colisão Attack Clash
- [x] Metadados temporários de transição dos módulos são limpos ao fim do temporizador; a limpeza ocorre no loop fixo de dez módulos já existente, sem alocação adicional.
- [ ] Confirmar em gameplay que reparo, reconstrução e substituição encerram a animação sem salto visual ou alteração inesperada do tipo de arma.


- [x] Adicionar ângulo individual de torre e limites de arco conforme a família e o lado do casco.
- [x] Limitar a velocidade de rotação de metralhadoras, plasma, mísseis e canhão principal.
- [x] Habilitar guiagem gradual dos projéteis de míssil do encouraçado em direção à nave do jogador.
- [x] Introduzir resistência de colisão dos projéteis inimigos baseada na classe de dano; o disparo do jogador consome resistência e pode neutralizar o projétil em colisões subsequentes.
- [ ] Validar visualmente os arcos, direção dos canos e equilíbrio do Attack Clash em celular/desktop.
- [ ] Testar se os mísseis podem ser evitados e se a guiagem não produz curvas abruptas.



### Auditoria integrada de combate — revisão estática (30/10/2026)
- [x] Confirmar que a sequência de destruição interrompe a IA ofensiva do boss, ignora novos danos durante a finalização e concede recompensas somente uma vez após os 8,4 s.
- [x] Confirmar que projéteis pesados mantêm resistência de Attack Clash proporcional ao dano (faixas padrão: 1, 2 ou 3), e que a resistência é consumida por impactos sucessivos.
- [x] Confirmar que projéteis guiados atualizam a direção com limite angular por segundo e preservam a velocidade definida.
- [x] Confirmar que o dano regional consome primeiro o escudo correspondente, direciona o dano excedente ao módulo mais próximo dentro da área de impacto e só então aplica dano ao casco.
- [x] Confirmar que loops de colisão ignoram entidades inativas/em destruição e que listas de projéteis são compactadas in-place após a resolução.
- [ ] Validar em gameplay a interação entre Attack Clash e projéteis de plasma/mísseis, incluindo impactos simultâneos e leitura visual da resistência restante.
- [ ] Executar testes reais de navegador, gameplay mobile/desktop e perfilamento de FPS; esta revisão foi estática e não comprova desempenho medido.

## Revisão de desempenho do boss — pontos de atenção
- A simulação do boss ainda percorre módulos e setores de escudo; o conjunto é fixo (10 módulos/4 escudos), portanto o custo é limitado.
- O HUD do boss usa a cadência de atualização já limitada por `hudUpdateInterval`, sem trabalho DOM novo por frame.
- O render do encouraçado usa Canvas 2D e formas vetoriais; os novos indicadores de plasma usam apenas arcos/círculos sem `shadowBlur`, filtros ou partículas persistentes.
- O projétil de plasma reaproveita a lista já existente de projéteis inimigos e o loop de colisão existente; não cria subsistemas de física.
- Ruptura aplica um estado temporário de desestabilização aos inimigos: a IA suspende perseguição e disparos enquanto o impulso físico é amortecido, evitando o conflito de aproximação/recuo. O estado usa dois escalares de impulso e um temporizador por inimigo, sem listas auxiliares ou tarefas por quadro.
- Impactos de plasma aplicam desestabilização temporária aos controles do jogador, com recuperação progressiva da autoridade de movimento; a mensagem reutiliza o feedback existente.
- Ainda é necessária medição real em dispositivos mobile e desktop com o perfil de desempenho ativado; CI não mede FPS.


## Revisão de consistência do arsenal do boss — 30/10/2026
- [x] Comparar a cadência global de disparo (2,35 s / 2,05 s / 1,7 s por fase) com os ciclos locais de plasma (2,6 s) e com os módulos ativos.
- [x] Identificar e remover o disparo de dano do canhão principal de energia nas fases 2 e 3; nesta candidata ele mantém hardware e rastreamento visual, mas não lança projéteis.
- [ ] Projetar e validar separadamente a telemetria de carga, alerta de perigo, janela de reação e contra-jogo do canhão principal antes de habilitar qualquer ataque.
- [ ] Balancear dano acumulado por salva, pressão de mísseis guiados, dois canhões de plasma e sobrevivência dos módulos somente após teste real de gameplay.
- Observação: os valores atuais de dano/cadência permanecem parâmetros provisórios; a auditoria estática não substitui observação de tempo para reagir nem medição de dificuldade.


## Escudos reativos — primeira implementação visual (30/10/2026)
- [x] Manter a proteção lógica 360° do jogador independente da direção do efeito visual.
- [x] Direcionar a previsão para o ponto de aproximação mais próximo do projétil, em vez de usar apenas sua posição atual.
- [x] Animar o setor local com expansão, bordas e traços radiais curtos; o efeito não cria esfera permanente nem partículas por quadro.
- [x] Reforçar visualmente o setor no instante em que absorve um impacto real.
- [x] Dar resposta de impacto aos quatro setores do encouraçado, com pulso local de curta duração e baixa presença em repouso.
- [x] Dar resposta de absorção aos escudos das tropas de elite sem alterar seus valores de proteção.
- [ ] Validar leitura visual, múltiplos projéteis simultâneos, orientação relativa, escala do zoom e custo em celular/desktop.
- Nota: esta etapa altera somente apresentação; valores de integridade, absorção, recarga e colisão permanecem inalterados. Checks automatizados não substituem teste real de gameplay ou FPS.


## Correções da auditoria integrada — 30/10/2026

- [x] Corrigida a aplicação duplicada do fator de desestabilização no movimento do jogador. A autoridade de controle agora é reduzida uma única vez na velocidade-alvo, mantendo a recuperação progressiva prevista (38% até 100%).
- [x] Corrigido o pulso visual dos escudos de elite: `eliteShieldFlash` agora decai com `dt` durante a atualização da entidade, em vez de permanecer no estado de impacto até o escudo ser esgotado.
- [ ] Validar em gameplay a duração perceptível do pulso de elite e a recuperação do controle após impacto de plasma.
- [ ] Confirmar que não há regressão de movimento com teclado, joystick e toque; CI não substitui esses testes.


### Limpeza de estado entre partidas — 30/10/2026
- Reinício agora zera os oito setores visuais de ameaça do escudo e o temporizador do scanner sem recriar a coleção.
- Alvos de mísseis reservados são limpos junto com a lista de mísseis.
- Mira de mouse/toque e captura de arrasto são desativadas ao iniciar uma nova partida, evitando herdar direção/pointerId da rodada anterior.
- [ ] Validar reinício após combate com escudo ativo, mísseis no ar e toque pressionado; confirmar que a nova partida começa sem pulsos, alvos ou direção residual.


### Geometria do laser contínuo — auditoria integrada (30/10/2026)
- Corrigido o teste de interseção do feixe com projéteis inimigos: o raio usado agora soma o raio físico do projétil à meia-largura visual do feixe (7 px).
- Corrigido o teste de interseção do feixe com inimigos: o raio agora soma o raio de colisão da entidade (incluindo o footprint ampliado do boss) à meia-largura do feixe (13 px).
- A alteração corrige falsos negativos em interseções visíveis nas bordas; não altera dano, cadência, alcance ou custo de ativação.
- [ ] Validar visualmente colisões tangenciais do feixe com inimigos pequenos, encouraçado e projéteis inimigos; confirmar que a leitura visual corresponde ao contato.


## Canhão principal — validação manual pendente
- [ ] Na fase I, confirmar que o canhão permanece em espera e não mostra telemetria de carga.
- [ ] Na fase II/III, confirmar o progresso visual de carga no módulo frontal e no HUD tático.
- [ ] Confirmar que o estado muda para alerta de energia crítica ao fim da carga e depois entra em recuperação.
- [ ] Destruir/inoperar o módulo e confirmar que a telemetria é interrompida; verificar retomada após reconstrução.
- [ ] Confirmar que o canhão não cria projéteis, feixes ofensivos, dano ao jogador ou eventos de Attack Clash.
- [ ] Verificar legibilidade em celular e desktop com zoom tático ativo e a preferência de movimento reduzido.


## Expansão adicional da arena — validação pendente (30/10/2026)
- [ ] Confirmar limites físicos em todos os quatro lados com o mundo em 2,4× viewport por eixo.
- [ ] Confirmar que a câmera enquadra a arena inteira ao atingir o zoom calculado de `1 / 2.4` e não ultrapassa seus limites.
- [ ] Testar conversão de coordenadas de mira com mouse e toque antes, durante e depois da transição de zoom.
- [ ] Testar movimento por teclado, joystick e toque nos quatro quadrantes, incluindo os limites do mundo.
- [ ] Testar spawn e entrada do encouraçado, patrulha e reposicionamento horizontal no novo espaço.
- [ ] Verificar flanqueamento e acesso aos quatro setores de escudo em combate real.
- [ ] Medir tempo de update/render, memória do cache de fundo e FPS em celular e desktop; registrar dispositivo e condições.
- Nota: o aumento de área não cria canvas de fundo proporcional ao mundo; o cache permanece limitado ao viewport visível. Checks de sintaxe/imports não comprovam FPS nem jogabilidade.


## Desprendimento estrutural — validação pendente
- [ ] Observar as quatro placas se soltando em tempos diferentes durante a finalização de 8,4 s.
- [ ] Confirmar deriva lateral, rotação e desaparecimento antes da remoção final do chefe.
- [ ] Verificar que fragmentos são puramente visuais, sem hitbox, dano, colisão ou seleção de mísseis.
- [ ] Observar o custo de renderização com zoom tático em celular e desktop; não inferir FPS pelo CI.
