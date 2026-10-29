## Patch v0.30.1 — otimização e diagnóstico
- [x] Medidor de FPS opcional nas configurações, com atualização limitada a duas vezes por segundo.
- [x] Pulso de Ruptura semicircular de 180° e alcance ampliado.
- [x] Repulsão por nível e custo térmico aumentado para a habilidade de emergência.
- [x] Medidor vertical independente e desaceleração moderada da recuperação térmica.
- [x] Recuo amortecido ao receber impacto e faíscas limitadas em estado crítico.
- [ ] Teste manual de FPS e engasgada durante uso do Pulso de Ruptura em celular.
- [ ] Ajustar balanceamento e repulsão após feedback do usuário.

# Roteiro de desenvolvimento — GALACTIC-DEFENDER

Este roteiro organiza a expansão em etapas pequenas. A versão oficial permanece em `main`; cada etapa deve ser revisada em um pull request e validada no GitHub Pages antes da publicação. A aprovação para implementar uma etapa não autoriza automaticamente o merge.

## Etapa 1 — Preparação da missão (v0.21.0)
- Separar o botão Jogar do início efetivo da partida.
- Mostrar modos disponíveis e deixar explícito quando um modo ainda está em desenvolvimento.
- Permitir preparar a orientação e ativar tela cheia antes do início.
- Confirmar que o loop de jogo não avança enquanto a tela de preparação está aberta.

## Etapa 2 — Hangar e seleção de nave (v0.22.0)
- Implementar uma tela de hangar antes da preparação da missão.
- Disponibilizar três cascos visuais selecionáveis (Vanguard, Phantom e Aegis), persistindo a escolha localmente.
- Manter atributos idênticos entre os cascos para separar personalização visual de balanceamento.
- Renovar a nave do jogador e as silhuetas da facção inimiga, mantendo o Canvas 2D e efeitos de baixo custo.
- Adicionar inclinação pseudo-3D ao movimento lateral sem alterar a lógica de mira ou o vetor de movimento.
- Ajustar a preparação em tela cheia para manter ações acessíveis em telas baixas.

## Etapa 2.1 — Resposta visual ao movimento (v0.23.0)
- Fazer a propulsão responder à entrada do jogador: chama maior durante o deslocamento e retorno suave ao repouso.
- Usar brilhos laterais discretos para reforçar o impulso sem modificar a física de movimento, a mira ou o dano.
- Manter Canvas 2D, baixo custo de renderização e compatibilidade com controles de teclado e joystick.
- Validar no GitHub Pages em celular e computador antes do merge.

## Ajuste de polimento — Elasticidade inimiga (v0.24.2)
- Reduzir discretamente o alongamento visual dos inimigos após o feedback do teste da v0.24.1, sem remover a resposta elástica.
- Manter a correção de aproximação e varredura horizontal do chefe da onda 5.
- IA e padrões de perseguição permanecem como estão; revisar inteligência e comportamento em uma etapa futura separada.
- Validar a nova intensidade no GitHub Pages em celular antes de iniciar a próxima etapa.

## Etapa 2.2 — Movimento fluido da facção inimiga (v0.24.0)
- Aplicar rotação e inclinação suaves orientadas pelo movimento real de cada inimigo, com propulsão leve em Canvas 2D.
- Dar padrões laterais legíveis por classe: curvas de aproximação para interceptadores, faixa de tiro móvel para sentinelas e desvios controlados para perseguidores.
- Preservar os valores atuais de dano, integridade, cadência e mira dos projéteis; observar equilíbrio e fluidez no GitHub Pages antes de avançar.

## Etapa 2.3 — Polimento do movimento inimigo (v0.24.1)
- Reforçar o alongamento e a inclinação dos inimigos durante mudanças de direção, aproximando a resposta visual da nave do jogador.
- Corrigir a trajetória do chefe para avançar até uma faixa de combate e percorrer a arena horizontalmente de forma suave.
- Preservar mira, dano, integridade e regras de combate; validar no GitHub Pages em celular antes de iniciar a etapa seguinte.

## Etapa 3 — Novas cartas de atributos e habilidades
- [ ] **v0.29.0 candidata:** validar a reestruturação visual do escudo, ativação da Onda do Escudo (botão/tecla Q), cancelamento de projéteis inimigos, dano moderado, recarga e desempenho em celular.
- [ ] Etapa futura: unificar colisões para a onda interagir com feixes contínuos e ataques especiais de inimigos/bosses quando esses ataques forem implementados.
- [ ] Após validar a otimização: fragmentação controlada dos mísseis no nível 3, com poucos fragmentos e dano adicional limitado.
- [x] Auditar as cartas existentes e os marcos de progressão antes de adicionar outra opção.
- [x] Introduzir escolhas com efeitos distintos, não apenas bônus numéricos.
- [x] Definir limites de níveis para evitar que as novas cartas continuem aparecendo após o máximo.
- [x] Revisar a distribuição funcional das cartas após o teste manual da v0.26.0; o usuário confirmou que tudo funciona corretamente.
- [x] **v0.28.0:** protótipo do Míssil teleguiado e pesos de aparição das raridades.
- [x] **v0.28.6 — validação visual:** o usuário confirmou que os mísseis nas pontas da nave estão visualmente corretos. A garantia temporária da carta era diagnóstica; a raridade ponderada original foi restaurada na v0.29.0.
- **v0.28.5:** candidata anterior com ajustes visuais de lançamento; substituída pela v0.28.6 para investigar a carta que não aparecia. Não mesclar separadamente.
- **v0.28.4:** candidata anterior substituída pela v0.28.5; não mesclar separadamente.
- **v0.28.3:** candidata anterior substituída pela v0.28.4; não mesclar separadamente.
- **v0.28.2:** candidata substituída após teste manual; não mesclar separadamente.
- **v0.28.1:** candidata anterior substituída após o relato de ativação intermitente, lançamento único e botão grande; não mesclar separadamente.
- **v0.25.0:** Cadência aprimorada, +10% por nível, até cinco níveis.
- **v0.26.0 validada pelo usuário:** Projéteis acelerados (+15% de velocidade por nível, até três níveis) e Controle de propulsão (+8% de aceleração por nível, até três níveis).

## Etapa 4 — Novas classes de inimigos
- [x] **v0.27.0:** Adicionar o Guardião, uma classe lenta e resistente que pressiona o jogador sem disparos à distância; aparece a partir da onda 3.
- [ ] Adicionar outras classes com comportamentos próprios, como artilheiro ou elite, sem duplicar sentinelas, interceptadores e perseguidores.
- [ ] Ajustar a frequência de surgimento e a dificuldade por onda com base no teste manual.

## Etapa 5 — Bosses com fases
- Definir identidade e padrões de ataque para o boss atual.
- Introduzir mudanças de comportamento por limiares de integridade.
- Reservar ataques especiais e feixes de alta potência para bosses e inimigos selecionados.

## Etapa 6 — Fundação de colisões de ataques
- Auditar colisões e ciclo de vida de projéteis antes de criar novas interações.
- Definir quais ataques podem destruir, atravessar, bloquear ou anular outros ataques.
- Verificar o custo de colisões em cenários com muitos projéteis.

## Etapa 7 — Attack Clash
- Prototipar o confronto entre feixes em um cenário controlado.
- Combinar sustentação do ataque, ações curtas de reação e atributos da nave.
- Implementar vitória, derrota e empate, incluindo deslocamento coreografado e limites da arena.
- Integrar a mecânica a um boss apenas após validar controles de PC e mobile.

## Candidata integrada v0.30.0 — habilidades e energia
- [x] **Pulso de Ruptura:** habilidade frontal, separada da onda automática, disponível somente enquanto o escudo está quebrado; remove projéteis e aplica dano controlado uma vez por inimigo atingido.
- [x] **Sobrecarga compartilhada:** lasers, mísseis e Pulso de Ruptura acumulam energia; acima de 70% há redução de potência/velocidade e no limite as habilidades especiais são bloqueadas temporariamente.
- [x] **Mísseis nível 3:** fragmentação limitada a três projéteis secundários mais fracos, com limite total de mísseis ativos.
- [ ] **Validação manual:** testar em celular e computador, especialmente janela curta do escudo quebrado, barreira frontal, recarga, sobrecarga e fragmentação.
- [ ] **Balanceamento:** ajustar custos e recuperação de energia com base no teste; os valores atuais são iniciais.
- [ ] **Attack Clash e ataques contínuos:** permanecem futuros; ainda falta uma interface comum de ataques e colisões para feixes e habilidades especiais de bosses.

## Regras de execução
- Uma mudança lógica por PR, com commits pequenos e mensagens descritivas.
- Manter Canvas 2D até o marco v1.0.0.
- Validar sintaxe, imports e workflows automatizados; depois testar pelo GitHub Pages em computador e celular.
- Não afirmar teste manual sem confirmação explícita do usuário.
- Seguir versionamento semântico: correção incrementa patch; funcionalidade incrementa minor; marco estável pode atingir v1.0.0.
