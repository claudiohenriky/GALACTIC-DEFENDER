# Validação de desempenho — GALACTIC-DEFENDER

## Estado da versão 1.0.0

A v1.0.0 mantém o Canvas 2D como renderizador principal e adiciona pós-processamento WebGL opcional. Os shaders começam desligados; isso evita impor o custo adicional do pipeline aos dispositivos móveis sem escolha explícita do jogador.

O pipeline de shaders usa a resolução do canvas de origem, não adiciona supersampling e deixa a simulação, colisões, IA e dano fora do passe gráfico. Se WebGL não estiver disponível ou perder o contexto, a renderização 2D continua disponível.

**Não há uma medição nova de FPS em aparelho físico associada a esta publicação.** Os testes automatizados validam lógica e estrutura, mas não comprovam taxa de quadros ou temperatura em dispositivos reais.

## Protocolo recomendado

1. Use o mesmo aparelho, navegador, orientação e escala de câmera em todas as rodadas.
2. Ative o medidor de FPS nas configurações.
3. Jogue por pelo menos 30 segundos em uma onda normal.
4. Repita durante combate intenso, com inimigos, projéteis e asteroides.
5. Repita na luta contra o Encouraçado, incluindo a cutscene, mísseis e habilidades.
6. Compare Desligado, Baixo, Médio e Alto. Faça três rodadas por preset e registre a mediana.
7. Registre FPS, tempo médio por quadro, travamentos, erros visuais e resposta dos controles.

## Critérios de observação

- O HUD deve permanecer legível e não cobrir diálogos ou alertas.
- O passe WebGL deve corresponder ao tamanho e à proporção do canvas original.
- Os controles e a simulação não podem mudar ao alternar presets.
- Desligar os shaders deve restaurar a exibição Canvas 2D.
- A ausência de WebGL deve produzir fallback sem impedir o jogo.
- Efeitos individuais desligados não devem ser enviados como ativos ao shader.

## Diagnóstico opcional

1. Abra a versão de teste e acrescente `?profile=1` ao endereço.
2. Inicie uma partida e jogue por pelo menos 30 segundos.
3. No console, procure `[GALACTIC-DEFENDER profile]` para consultar intervalo entre quadros, FPS estimado e tempos de atualização/renderização.
4. Compare a mesma versão de navegador, orientação, aparelho e cenário; faça três rodadas e use a mediana.

## Limites

- O profiler acrescenta custo de medição e deve ser usado apenas para diagnóstico.
- Tempo de execução de uma habilidade não mede sozinho os quadros seguintes.
- Não declare ganhos de FPS sem dados do dispositivo.
- A aprovação de CI não substitui teste visual e de gameplay em celular e computador.
