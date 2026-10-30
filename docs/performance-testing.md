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
- [x] Auditar a atualização das partículas de dano, partículas de nível e efeitos de quebra de escudo: as listas já são compactadas in-place, sem arrays novos por quadro.
- [x] Remover callbacks `forEach()` do desenho das faíscas/fumaça e partículas de nível; a renderização usa loops indexados no caminho por quadro.
- [ ] Auditar fumaça, fogo, faíscas e escudos específicos do chefe, incluindo custo de Canvas e quantidade de efeitos.
- [ ] Auditar a IA e a separação espacial quando houver muitos inimigos e projéteis simultâneos.
- [ ] Conferir alocações temporárias e chamadas caras de Canvas no caminho de renderização.

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
