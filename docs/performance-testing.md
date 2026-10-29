# Validação de desempenho — v0.18.1

Esta rotina ajuda a comparar cenários, mas não substitui teste em dispositivos reais.

## Diagnóstico opcional do ciclo

1. Abra a candidata v0.18.1 pelo GitHub Pages no navegador disponível.
2. Acrescente `?profile=1` ao endereço da página (por exemplo, `index.html?profile=1`).
3. Inicie uma partida e deixe o jogo funcionar por pelo menos 30 segundos.
4. No console, procure mensagens `[GALACTIC-DEFENDER profile]`. Cada relatório reúne 180 quadros e mostra:
   - intervalo médio entre quadros e FPS estimado a partir desse intervalo;
   - tempo médio gasto em atualização, renderização e trabalho do ciclo;
   - quantidade atual de inimigos, projéteis e efeitos.
5. Repita no mesmo dispositivo, navegador, orientação de tela e cenário aproximado, primeiro com a versão de referência e depois com a candidata.
6. Faça pelo menos três rodadas por versão e compare a mediana dos resultados. Anote modelo do aparelho, navegador, orientação, quantidade aproximada de inimigos e se o aparelho estava aquecido.

## Cuidados de interpretação

- O profiler só mede quando `?profile=1` está presente; não faz parte da experiência normal de jogo.
- A medição inclui o custo da instrumentação e é adequada para comparação aproximada, não como benchmark científico.
- A estimativa de FPS é calculada pelo intervalo dos quadros de `requestAnimationFrame`; não garante que cada quadro tenha sido desenhado na tela.
- Compare o mesmo cenário. Diferenças de ondas, inimigos, efeitos, economia de energia, temperatura e abas em segundo plano podem distorcer os resultados.
- Não declare melhoria de desempenho antes de reunir dados reais. Registre também travamentos, erros e qualquer alteração percebida nos controles.

## Critério de aprovação da v0.18.1

- Verificações automáticas de sintaxe e caminhos de imports aprovadas.
- O usuário confirma no GitHub Pages que a barreira, a barra, a quebra, o dano em área e a recarga continuam funcionando.
- Comparar a fluidez percebida com a versão de referência no mesmo dispositivo e cenário; não afirmar melhoria medida sem dados.
- Revisão final do diff e aprovação explícita antes de integrar à `main`.
- O projeto é validado pelo navegador publicado; não exigir execução local do usuário.
