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
- [ ] Validar visualmente o zoom em celular e desktop, incluindo mira manual, bordas do cenário e transição após a derrota do chefe.
- [ ] Refinar a arte/variedade dos efeitos e revisar o custo visual com o chefe em combate.
- [ ] Auditar a IA e a separação espacial quando houver muitos inimigos e projéteis simultâneos.
- [ ] Conferir alocações temporárias e chamadas caras de Canvas no caminho de renderização.

- [x] Corrigir a contenção vertical genérica que prendia o chefe à borda superior durante a entrada: a nave agora pode permanecer fora da área visível até concluir a aproximação, mantendo o limite horizontal e o limite inferior. Esta é uma correção de lógica/entrada, não uma medição de desempenho.

- [x] Corrigir a ordem de inicialização de `bossWave` no spawn: a classificação da onda agora é calculada antes de determinar a posição inicial, evitando referência à variável antes da declaração no ciclo de criação de inimigos.

### Cenários de validação após a auditoria

- [ ] Onda comum com quantidade alta de inimigos e projéteis.
- [ ] Chefe da onda 10 com todos os módulos e escudos ativos.
- [ ] Chefe após perder vários armamentos e setores de escudo.
- [ ] Transição de sobrecarga e reconstrução de módulos.
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

- O mundo de simulação passa a medir 1,6 vez a largura e a altura da área visível do Canvas.
- A câmera acompanha suavemente a nave do jogador e respeita os limites do mundo, inclusive durante o zoom dinâmico do chefe.
- Jogador, inimigos, separação espacial, projéteis e mísseis teleguiados usam os limites do mundo expandido; a tela continua sendo apenas a janela de visualização.
- Mouse e toque são convertidos de coordenadas de tela para coordenadas do mundo considerando posição e zoom da câmera.
- Inimigos comuns surgem no topo da área atualmente visível; a entrada do chefe usa o topo da câmera e sua patrulha permanece ancorada à posição do jogador.
- O fundo em grade e as estrelas acompanham o mundo expandido.

**Validação pendente:** revisão estática dos limites e transformações concluída parcialmente; ainda é necessário executar a suíte de sintaxe/imports e testar gameplay real em celular e desktop. Não há medição de FPS para esta alteração. Verificar principalmente movimentação até as quatro bordas, mira por toque/mouse, entrada do chefe, colisões e limpeza de projéteis.
