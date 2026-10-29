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

## Checklist da candidata v0.29.1

- [ ] Comparar partida leve e partida com muitos inimigos/projéteis.
- [ ] Registrar se há travamento na primeira ativação de habilidade.
- [ ] Observar se a fluidez piora progressivamente durante a partida.
- [ ] Confirmar que os controles continuam responsivos.
- [ ] Não mesclar à `main` sem validação manual e aprovação explícita.
