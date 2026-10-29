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

## Etapa 2.2 — Movimento fluido da facção inimiga (v0.24.0)
- Aplicar rotação e inclinação suaves orientadas pelo movimento real de cada inimigo, com propulsão leve em Canvas 2D.
- Dar padrões laterais legíveis por classe: curvas de aproximação para interceptadores, faixa de tiro móvel para sentinelas e desvios controlados para perseguidores.
- Preservar os valores atuais de dano, integridade, cadência e mira dos projéteis; observar equilíbrio e fluidez no GitHub Pages antes de avançar.

## Etapa 3 — Novas cartas de atributos e habilidades
- Auditar as cartas existentes e os marcos de progressão antes de adicionar outras.
- Introduzir escolhas com efeitos distintos, não apenas bônus numéricos.
- Definir regras de raridade, compatibilidade e limites para evitar combinações desbalanceadas.
- Considerar o míssil como nova habilidade especial após a revisão do sistema de projéteis.

## Etapa 4 — Novas classes de inimigos
- Adicionar classes com comportamentos próprios, por exemplo guardião, artilheiro e elite.
- Evitar duplicar os comportamentos atuais de sentinelas, interceptadores e perseguidores.
- Ajustar a frequência de surgimento e a dificuldade por onda.

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

## Regras de execução
- Uma mudança lógica por PR, com commits pequenos e mensagens descritivas.
- Manter Canvas 2D até o marco v1.0.0.
- Validar sintaxe, imports e workflows automatizados; depois testar pelo GitHub Pages em computador e celular.
- Não afirmar teste manual sem confirmação explícita do usuário.
- Seguir versionamento semântico: correção incrementa patch; funcionalidade incrementa minor; marco estável pode atingir v1.0.0.
