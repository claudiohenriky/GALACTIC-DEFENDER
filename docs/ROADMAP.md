## Candidata v0.44.0 — Primeiro chefe: nave de guerra pesada

- Branch: `feature/v0.44.0-boss-evolution`, baseada na candidata v0.43.0; PR #78 e `main` permanecem sem merge.
- Aparição: primeira batalha na onda 10; recorrência a cada cinco ondas a partir daí.
- Nave: casco muito maior e lento, orientação de armamentos independente do deslocamento, silhueta de encouraçado espacial.
- Arsenal inicial: dez módulos independentes (metralhadoras, mísseis, lasers leves, canhões de plasma, canhão de energia e suporte).
- Componentes: estados operacional, danificado, inoperante e destruído; dano direcionado por região de impacto.
- Escudos: quatro setores regionais; o sistema auxiliar condiciona a recarga.
- Sobrecarga: uma transformação ao atingir 33% do casco; módulos destruídos são substituídos, danificados/inoperantes recebem reparos emergenciais e o casco retorna a 50%.
- Ataques: pressão de lasers/metralhadoras, mísseis e plasma de alto impacto. O canhão principal de energia permanece em preparação visual/rastreamento, sem disparo danoso até que carga, alerta, janela de reação e contra-jogo sejam implementados e validados.
- Interface: barra exclusiva de integridade do casco e indicação de fase, atualizadas junto da telemetria já limitada por intervalo.
- Otimização inicial: seleção do alvo do laser sem ordenação de arrays, checagem de aproximação com distância ao quadrado, reservas de alvos dos mísseis calculadas uma vez por quadro e remoção de `shadowBlur` no núcleo do chefe; ainda sem medição de FPS.
- Visual: primeira composição de nave de guerra em Canvas; entrada cinematográfica e zoom de câmera implementados. A destruição agora tem cinco detonações locais escalonadas, chamas nas brechas, fumaça persistente e duas ondas de choque na explosão final; a nave permanece visível durante a sequência, sem atacar ou receber dano, e desaparece após a conclusão. Arte final em pixel art e efeitos avançados de fogo/fumaça/faíscas continuam pendentes.
- Arena: primeira implementação da expansão física concluída na branch — mundo com 1,6× a largura e a altura do viewport, câmera de acompanhamento, limites ampliados e mira convertida para coordenadas do mundo. Spawn comum e entrada do chefe foram ajustados à área visível; o Artilheiro acompanha a faixa do jogador. O encouraçado tem reposicionamento e rotação lentos para permitir flanqueamento, além de hitbox ampliada alinhada à silhueta blindada. O cache do fundo permanece limitado ao viewport. A implementação ainda requer teste real em celular e desktop.
- Próxima sequência: validar movimentação nos quatro limites, colisões, mira por toque/mouse, câmera, rotação lenta, flanqueamento e a nova sequência de destruição; depois refinar fogo/fumaça/faíscas/reconstrução e aprimorar o HUD do chefe.
- Validação geral: revisão estática dos caminhos de viewport/mundo, câmera, mira, movimentação, projéteis, colisões, separação e renderização concluída; os checks automatizados de sintaxe JavaScript, imports relativos e whitespace passaram no HEAD atual. Permanecem pendentes testes de navegador, estresse com alta densidade de entidades e medição real de FPS para a expansão atual.
- Não mesclar em `main` sem aprovação explícita.

## Candidata v0.43.0 — Evolução da IA inimiga

- Branch: `feature/v0.43.0-enemy-ai-evolution`, baseada no commit da candidata v0.42.1; PR #76 e `main` permanecem sem merge.
- Sentinela normal: reduzir a intensidade e a frequência das esquivas, limitar amplitude lateral e tornar o reposicionamento menos agressivo.
- Sentinela de Elite: receber esquivas mais fortes e longas, menor intervalo entre reações, curvas mais amplas e reposicionamento mais responsivo; preservar a salva dupla de plasma.
- Artilheiro de Elite: reforçar a diferença para a unidade normal com evasão superior e leque mais concentrado, rápido e ligeiramente mais danoso; preservar o escudo atual.
- Otimização: não percorrer projéteis enquanto a unidade está em recarga de esquiva.
- Chefes: preservar integralmente fases, movimento e padrões de disparo nesta etapa.
- Escopo: não alterar regras de dano/colisão compartilhadas, frequência de surgimento de elites ou habilidades do jogador.
- Estado: implementação inicial registrada; revisão de código e verificações automatizadas pendentes. Teste de ondas longas não será exigido isoladamente; observar o comportamento durante a próxima validação natural.
- Não mesclar em `main` sem aprovação explícita.

## Candidata v0.42.1 — Guardião de Elite: Égide de Proteção

- Branch: `feature/v0.42.1-guardian-elite-aegis`, baseada na candidata v0.42.0.
- Guardião de Elite: +2 pontos de integridade sobre o Guardião normal, mantendo escudo pessoal de 12 pontos.
- Habilidade Égide: barreira externa compartilhada de 18 pontos ao redor de até duas tropas designadas; absorve dano até acabar e não regenera nesta versão.
- Distribuição: cada Guardião, normal ou Elite, protege no máximo duas tropas exclusivas; nenhuma tropa pode ser atribuída a mais de um Guardião simultaneamente.
- Guardiões de Elite recebem prioridade de alocação; a cooperação das Sentinelas respeita a atribuição efetiva.
- Estado: candidata; requer teste manual de formação, interceptação de dano e balanceamento. Não mesclada em `main`.

## Candidata v0.42.0 — Identidade Elite e Guardião de Elite

- Branch: `feature/v0.42.0-elite-identity-guardian`, baseada na candidata v0.41.0.
- Artilheiro de Elite: recuperar casco predominantemente preto e detalhes verdes; preservar escudo de 8 pontos.
- Sentinela de Elite: reforçar silhueta e identidade visual sem alterar a salva dupla de plasma.
- Guardião de Elite: entrada a partir da onda 16, escudo defensivo próprio de 12 pontos e manutenção da função de proteção tática de aliados.
- Remover nomes flutuantes; mostrar alerta de ameaça uma única vez por classe em cada partida e somente após o spawn real.
- Usar barra de integridade reforçada e efeito de entrada por distorção espacial breve, com renderização leve.
- Desempenho: queda de FPS relatada continua pendente de perfilamento e otimização em etapa dedicada; não declarar resolvida nesta versão.
- Estado: candidata; requer teste manual em celular e computador. Não mesclada em `main`.

## Próxima sequência do sistema Elite

- [x] Artilheiro de Elite — primeira prova de conceito e refinamento visual.
- [x] Sentinela de Elite — salva dupla de plasma e identidade visual revisada.
- [x] Guardião de Elite — escudo próprio e papel defensivo preservado.
- [ ] Interceptador de Elite — preservar perseguição veloz e criar habilidade ofensiva própria.
- [ ] Revisar frequência e balanceamento das quatro variantes após teste geral.
- [ ] Investigar e otimizar a queda de FPS com perfilamento isolado.

## Candidata v0.41.0 — Segunda Tropa de Elite: Sentinela de Elite

- Branch: `feature/v0.41.0-sentinel-elite`, baseada na candidata v0.40.1.
- A Sentinela de Elite surge ocasionalmente a partir da onda 14, sem substituir as Sentinelas normais.
- Preserva o reposicionamento lateral, a mira no jogador e a cooperação tática com Guardiões.
- Habilidade especial: salva dupla de plasma com dois projéteis ligeiramente divergentes; cada projétil causa dano reduzido, mantendo dano total próximo ao disparo normal.
- Identidade visual: casco roxo, placas escuras, núcleo luminoso azul-claro e nome temporário na entrada.
- O escudo de 8 pontos continua exclusivo do Artilheiro de Elite.
- Estado: implementação candidata; validar frequência, legibilidade, balanceamento e desempenho no teste manual. Não mesclada em `main`.

## Próxima sequência do sistema Elite

- [x] Artilheiro de Elite — primeira prova de conceito e refinamento visual.
- [x] Sentinela de Elite — segunda variante, com salva dupla de plasma.
- [ ] Guardião de Elite — preservar a função de proteção e criar habilidade defensiva própria.
- [ ] Interceptador de Elite — preservar perseguição veloz e criar habilidade ofensiva própria.
- [ ] Revisar frequência e balanceamento das quatro variantes após teste geral.

## Candidata v0.40.1 — Refinamento das Tropas de Elite

- Branch: `feature/v0.40.1-elite-polish-performance`, baseada na candidata v0.40.0.
- Ajustes: paleta roxa predominante com placas pretas e detalhes verdes discretos; escudo segmentado inspirado no jogador, mantendo 8 pontos; efeito de entrada e identificação temporária; evasão lateral moderada inspirada na Sentinela; Guardião prioriza unidades Elite ativas antes das Sentinelas.
- Desempenho: removido o anel completo pulsante contínuo em favor de dois segmentos simples. A causa exata da queda de FPS reportada ainda precisa ser confirmada em teste real.
- Estado: aguardando validação estática e teste geral posterior; não mesclado em `main`.

## Candidata v0.40.0 — Artilheiro de Elite

- Implementação inicial registrada em `feature/v0.40.0-elite-variants`.
- O Artilheiro de Elite aparece ocasionalmente a partir da onda 12, mantém o comportamento de artilharia-base e recebe escudo de energia de 8 pontos que absorve dano antes do casco.
- Identidade visual: casco escuro, detalhes roxos e núcleo verde; o anel verde indica escudo ativo.
- Estado: aguardando teste manual; não mesclado em `main`.

## Planejamento v0.40.0 — Fundação das Tropas de Elite

### Princípios aprovados
- Tropas de Elite são variantes especiais das quatro classes existentes: Sentinela, Guardião, Interceptador e Artilheiro; não constituem uma quinta classe independente.
- Cada variante preserva a identidade tática da classe-base, mas recebe identidade visual própria e habilidades especiais legíveis.
- A referência visual do Artilheiro de Elite usa armadura predominantemente preta, mantendo detalhes roxos e podendo incluir acentos verdes.
- As variantes devem surgir apenas em ondas mais avançadas; a faixa exata de introdução (por volta das ondas 12–15) será definida no balanceamento.
- Escudos e ataques especiais, incluindo laser para inimigos selecionados e chefes, devem respeitar as regras existentes de colisão, sobrecarga e legibilidade.
- Não adicionar um inimigo genérico chamado `elite` como nova classe. Identificar a variante de Elite junto à classe-base para preservar comportamento, visual e balanceamento próprios.

### Implementação em etapas
- [x] Auditar a criação, renderização, IA, dano e surgimento das classes existentes antes de alterar código.
- [x] Implementar uma única variante inicial como prova de conceito: Artilheiro de Elite, sem ativar as demais variantes.
- [x] Adicionar identidade visual clara (casco escuro, detalhes roxos, núcleo verde) e escudo visível com absorção de dano; o escudo pode ser desgastado por disparos.
- [ ] Preservar as versões normais das quatro classes e a cooperação Guardião–Sentinela.
- [x] Atualizar versionamento de cache, changelog, README e roadmap na mesma etapa de código.
- [ ] Executar validações estáticas disponíveis e preparar branch de prévia + PR em rascunho.
- [ ] Entregar link Raw.githack para teste manual no celular; ajustar com base no feedback antes de avançar para outras variantes.
- [ ] Não mesclar em `main` sem aprovação explícita do usuário.

### Itens relacionados, mas separados
- [ ] Investigar a área útil da arena em celular na horizontal antes de ajustar dimensões ou escalas.
- [ ] Avaliar presença e apresentação do chefe, incluindo alerta de aproximação, escudo próprio e ataques especiais, em uma etapa controlada.
- [ ] Planejar melhorias visuais da nave do jogador conforme os armamentos desbloqueados, sem misturar essa mudança à primeira prova de conceito de Elite.

---

## Candidata v0.39.0 — Cooperação tática entre Guardião e Sentinela
- [x] Fazer o Guardião procurar uma posição de cobertura quando uma Sentinela estiver próxima.
- [x] Fazer a Sentinela ajustar suavemente sua posição para usar a cobertura do Guardião.
- [x] Preservar dano, integridade, disparos, colisões e invulnerabilidade existentes.
- [ ] Testar se a formação é compreensível e se as unidades não ficam presas, agrupadas ou oscilando.
- [ ] Validar ondas com várias classes e observar desempenho em celular e computador.
- [ ] Não mesclar em `main` sem aprovação explícita após teste manual.

## Investigação pendente — espaço útil da arena em celular na horizontal
- [ ] Medir/confirmar o espaço útil real durante uma partida, incluindo HUD e controles sobrepostos.
- [ ] Separar problema de dimensão do Canvas de percepção de densidade causada pelo tamanho dos inimigos e pela quantidade simultânea.
- [ ] Escolher ajuste somente após identificar a causa; não aumentar escala ou velocidade às cegas, nem comprometer legibilidade dos controles.
- [ ] Testar orientação, tela cheia, redimensionamento e limites de movimentação antes de considerar resolvido.

## Candidata v0.38.0 — Esquivas mais legíveis e separação entre inimigos
- [x] Aumentar moderadamente a amplitude lateral das esquivas sem alterar invulnerabilidade, dano ou cadência.
- [x] Adicionar separação local e suave para reduzir sobreposição entre cascos inimigos.
- [ ] Testar se as esquivas evitam disparos de forma perceptível sem tornar a IA injusta.
- [ ] Confirmar que a separação não provoca oscilação, dispersão excessiva ou queda de desempenho.
- [ ] Validar celular e computador manualmente; não mesclar em `main` sem aprovação.

## Feedback manual do v0.37.0
- [x] O usuário confirmou que o Artilheiro voltou a aparecer durante o teste.
- [x] O usuário percebeu melhoria geral e curvas laterais, mas considerou a esquiva curta demais; solicitou um aumento moderado.
- [x] O usuário observou sobreposição entre inimigos; esta candidata adiciona separação suave.
- [ ] Guardião continua sem uma mudança tática dedicada; cooperação/proteção entre classes permanece como etapa futura.

## Candidata v0.37.0 — Percepção de projéteis e esquivas limitadas
- [x] Prever o ponto de maior aproximação de projéteis usando velocidade relativa.
- [x] Reações curtas e com recarga para sentinelas, artilheiros e chefe.
- [x] Preservar dano, vida, cadência e regras de colisão.
- [ ] Testar se as esquivas são legíveis, não excessivas e não deixam a IA difícil demais.
- [ ] Verificar desempenho no celular e no computador, inclusive com muitos projéteis.
- [ ] Investigar o relato de ausência da tropa roxa em uma etapa separada, identificando primeiro em quais ondas/classes ela deve aparecer.

## Próxima etapa proposta
- Cooperação tática entre guardião e sentinela: bloqueio/proteção e reposicionamento coordenado, separada da percepção de projéteis.
- Balanceamento independente do Laser Contínuo: preparação visível, deslocamento visual do feixe, sobrecarga efetiva e Attack Clash reservado a ataques especiais.

## Candidata v0.36.0 — Fundação da IA inimiga
- [x] Separar orientação visual da direção do movimento para sentinelas, artilheiros e chefe.
- [x] Permitir que unidades de combate à distância mantenham o armamento apontado ao jogador durante reposicionamento.
- [x] Teste manual aprovado pelo jogador: orientação da Sentinela ficou muito mais natural, sem virar a traseira para o jogador durante o combate; agressividade percebida melhorou bastante.
- [ ] Próxima etapa proposta: percepção de projéteis com previsão de colisão e esquivas limitadas por classe.
- [ ] Etapa posterior: cooperação tática entre sentinela e guardião, sem tornar a IA perfeita ou injusta.

## Candidata v0.35.0 — Laser Contínuo e Attack Clash decisório
- [x] Preservar os Tiros Perfurantes de Plasma como habilidade independente.
- [x] Adicionar Laser Contínuo próprio, com feixe direcional, dano sustentado e custo de sobrecarga.
- [x] Adicionar decisões iniciais ao cruzar o feixe com um projétil inimigo: forçar vitória, sustentar empate ou escapar.
- [ ] Validar carta, controles por toque/tecla L, escolhas, dano em chefes, sobrecarga e recarga.
- [ ] Verificar FPS e regressões em celular/computador; não publicar em main antes da validação manual.

## Candidata v0.34.0 — Attack Clash e correção do chefe
- [x] Implementar colisão direta entre tiros do jogador e projéteis inimigos; ambos são neutralizados no choque.
- [x] Corrigir a regra de contato para impedir que colisão corporal derrote o chefe independentemente da vida restante.
- [ ] Testar colisões com tiros comuns e perfurantes, projéteis de várias classes e leques do chefe.
- [ ] Confirmar que o chefe continua ativo após contato e só é derrotado ao esgotar a integridade.
- [ ] Observar FPS e verificar regressões em celular e computador.
- [ ] Evoluir para resultados de confronto mais elaborados (vitória/derrota/empate e decisões de continuação) após validar esta primeira interação.

## Fundação v0.33.0 — geometria compartilhada de colisões
- [x] Criar utilitários puros para sobreposição circular e distância ao quadrado, sem impor regras de dano.
- [x] Migrar para a função compartilhada as colisões de tiros do jogador, mísseis guiados, contato inimigo e projéteis inimigos contra a nave.
- [x] Preservar regras atuais de dano, perfuração, invulnerabilidade e remoção de entidades.
- [ ] Testar manualmente as colisões existentes em celular e computador; observar FPS durante ondas cheias.
- [ ] Implementar a interação projétil-contra-projétil somente após validar esta fundação.

## Patch v0.30.4 — renderização leve do Pulso de Ruptura
- [x] Remover o preenchimento translúcido de grande área.
- [x] Preservar o contorno semicircular com traços neon discretos para sugerir plasma/fumaça.
- [x] Manter lógica de colisão, repulsão, alcance e duração gradual.
- [ ] Medir FPS durante ativação no celular e confirmar que a queda diminuiu.

## Patch v0.30.3 — escudo reativo e nomenclatura de plasma
- [x] Manter proteção lógica de 360° sem bolha visível permanente.
- [x] Exibir arcos localizados apenas em setores com projéteis em trajetória de colisão provável.
- [x] Limitar frequência de varredura e reutilizar oito setores para controlar o custo.
- [x] Tornar o Pulso de Ruptura mais gradual.
- [x] Renomear Laser perfurante para Tiros Perfurantes de Plasma.
- [ ] Testar no celular: escudo frontal/traseiro, múltiplas ameaças e FPS durante impactos.
- [ ] Confirmar que o escudo continua absorvendo dano e recarregando corretamente.

## Patch v0.30.2 — correções de interface e efeitos
- [x] Mover medidor térmico para fora do joystick e tornar o texto legível.
- [x] Mover o contador de FPS para longe das notificações de conquistas.
- [x] Usar fumaça de baixa frequência após sobrecarga crítica sustentada.
- [x] Reservar faíscas para integridade baixa e reduzir limite de partículas.
- [ ] Medir FPS antes/depois em celular e verificar a ativação do Pulso de Ruptura.
- [ ] Ajustar posição final da HUD após feedback do usuário.

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
- [x] **v0.31.0 candidata:** adicionar o Artilheiro a partir da onda 4, com movimento lateral à distância e salva de três tiros em leque.
- [x] **Teste manual concluído pelo usuário:** Artilheiro aparece na onda 4+, silhueta identificável, leque legível, dano/frequência equilibrados, desempenho aceitável e classes/chefe existentes funcionando.
- [x] **v0.27.0:** Adicionar o Guardião, uma classe lenta e resistente que pressiona o jogador sem disparos à distância; aparece a partir da onda 3.
- [ ] Adicionar outra classe com comportamento próprio, como elite, sem duplicar sentinelas, interceptadores, perseguidores ou o Artilheiro.
- [ ] Ajustar a frequência de surgimento e a dificuldade por onda somente se novos testes identificarem desequilíbrio.

## Etapa 5 — Bosses com fases
- [x] **v0.32.0 candidata:** três fases por limiares de integridade (66% e 33%), pausa de transição sinalizada e padrões de disparo crescentes.
- [ ] Testar no celular a transição, leitura dos leques, dano recebido, tempo para reagir e FPS.
- [ ] Ajustar o equilíbrio somente com base no teste manual.
- Definir identidade e padrões de ataque para o boss atual.
- Introduzir mudanças de comportamento por limiares de integridade.
- Reservar ataques especiais e feixes de alta potência para bosses e inimigos selecionados.

## Etapa 6 — Fundação de colisões de ataques
- [x] Auditar colisões e ciclo de vida de projéteis antes de criar novas interações.
- [x] Extrair geometria compartilhada para evitar duplicação de testes circulares.
- [ ] Definir regras por tipo de ataque: destruir, atravessar, bloquear ou anular.
- [ ] Medir o custo de colisões em cenários com muitos projéteis.
- [ ] Validar a v0.33.0 manualmente antes de implementar interações projétil-contra-projétil.

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


## HUD tático do encouraçado — candidata v0.44.0

- [x] Separar visualmente a integridade geral do casco dos quatro setores regionais de escudo.
- [x] Mostrar percentual e estado de cada escudo: operacional, danificado ou inoperante.
- [x] Representar os dez módulos independentes com indicadores individuais e abreviações identificáveis em grade 5×2: operacional, danificado, inoperante ou destruído.
- [x] Resumir armamentos disponíveis e estados degradados sem confundir módulos com integridade do casco.
- [x] Indicar fase de sobrecarga, reconstrução e sequência de destruição no cabeçalho do painel.
- [x] Adaptar grade e tipografia para telas estreitas e orientação horizontal.
- [ ] Validar a legibilidade e a ausência de sobreposição em navegador móvel e desktop.
- [ ] Confirmar durante gameplay a atualização dos indicadores após dano regional, desativação do gerador auxiliar e reconstrução da sobrecarga.


## Feedback de combate do encouraçado — candidata v0.44.0

- [x] Destacar brevemente a perda de integridade de cada setor de escudo e módulo atingido.
- [x] Diferenciar visualmente a recuperação de integridade com feedback verde.
- [x] Exibir uma barra de progresso durante a reconstrução da sobrecarga, usando a duração real configurada de 4,5 s.
- [x] Respeitar a preferência de movimento reduzido e manter a atualização na cadência limitada da HUD.
- [ ] Validar em gameplay as animações, a leitura da barra de reconstrução e o comportamento em telas pequenas.


## Integração de dano regional — candidata v0.44.0

- [x] Aplicar defesa regional também a habilidades especiais, laser contínuo e ataques de área sem ponto de impacto explícito, usando a posição do jogador como referência direcional.
- [x] Manter a posição real do projétil para impactos com coordenadas conhecidas.
- [ ] Validar em gameplay se cada ângulo de aproximação consome o setor esperado e se o dano residual chega ao casco/módulo corretamente.


## Reformulação integrada do encouraçado — rodada de desenvolvimento

- [x] Alongar a silhueta do casco e reduzir a rotação visual do corpo para reforçar massa/inércia.
- [x] Substituir sockets quadrados por representações distintas de metralhadoras, lançadores, lasers, plasma e canhão de energia.
- [x] Classificar destruição catastrófica por dano excedente; sobrecarga mantém e repara módulos recuperáveis, preserva os intactos e substitui apenas montagens irrecuperáveis.
- [x] Aumentar o mundo para 2× o viewport e manter zoom de 0,5 após a aparição do boss, enquadrando o mapa inteiro até o reinício.
- [ ] Implementar mira independente de torres, arcos de disparo por hardpoint e lançamento de mísseis guiados do boss.
- [ ] Implementar alerta de ameaça e entrada cinematográfica validada em tela real.
- [ ] Implementar sequência de falha estrutural, explosões distribuídas e deriva final do casco.
- [ ] Testar o novo enquadramento e a legibilidade do boss em celular/desktop; não há validação visual real nesta etapa.


### Armamentos independentes e Attack Clash — rodada de desenvolvimento

- [x] Cada hardpoint armado acompanha o jogador com ângulo próprio, velocidade de rotação por família e arco angular limitado pela posição/tipo da arma.
- [x] Disparos do encouraçado usam a orientação atual da torre, em vez de mirar instantaneamente através do casco.
- [x] Lançadores de mísseis do boss criam projéteis teleguiados com velocidade angular limitada.
- [x] Attack Clash aplica resistência graduada: projéteis leves são neutralizados por um impacto forte o suficiente; projéteis pesados exigem mais de um impacto ou disparos mais potentes.
- [ ] Testar arcos e rotação das torres em todas as posições relativas do jogador; validar homing e resistência dos projéteis em gameplay.


## Boss v0.44.0 — apresentação, sobrecarga e derrota (30/10/2026)
- Entrada ampliada para 5,2 s, com bloqueio de disparos durante a apresentação, alerta persistente no banner e identificação visual sobre o encouraçado.
- Sobrecarga sinaliza reparo, reconstrução e substituição de módulos com pulsos mecânicos locais, sem alterar a regra de preservação dos armamentos intactos.
- Finalização estendida para 8,4 s: o casco perde estabilidade, deriva e gira gradualmente enquanto as detonações percorrem a estrutura; remoção e recompensa continuam no término da sequência.
- Pendente: validar visualmente o tempo de leitura, a trajetória do destroço e a sobrecarga em gameplay real mobile/desktop.

## Desestabilização cinética — combate e ruptura (30/10/2026)
- Pulso de ruptura aplica impulso físico aos inimigos e suspende temporariamente perseguição/tiros enquanto o impulso é amortecido; a IA retoma o combate após a recuperação.
- O bloqueio temporário de steering evita que o inimigo tente avançar imediatamente contra o recuo, removendo a oscilação de aproximação/afastamento descrita no feedback.
- Impacto de plasma aplica repulsão e reduz temporariamente a autoridade de movimentação do jogador, com recuperação progressiva e aviso de sistemas desestabilizados.
- Duração inicial: 0,86 s para inimigos comuns, 0,58 s para boss e 1,45 s para o jogador. Valores são parâmetros iniciais e precisam de balanceamento em gameplay.


## Canhões de plasma do encouraçado — identidade de ataque (30/10/2026)
- [x] Limpar `transitionType` e `transitionFromKind` quando o temporizador de reparo, reconstrução ou substituição termina, evitando metadados visuais obsoletos.

- Canhões carregam independentemente por montagem, com indicador radial local e núcleo de energia crescente.
- Disparo pesado com projétil alongado, dano alto e impacto de repulsão forte.
- Ao atingir escudo ativo do jogador, o plasma rompe o escudo imediatamente, dispara o efeito de ruptura existente e aplica forte repulsão; sem escudo, causa dano elevado e repulsão ainda maior.
- O ciclo de carga é local por canhão, sem aumentar a frequência dos demais armamentos. Valores iniciais são de balanceamento e exigem teste de gameplay.


## Reformulação visual dos escudos — primeira passagem (30/10/2026)
- Jogador: a cobertura lógica continua 360°, mas apenas o setor previsto como ameaçado é desenhado. A previsão agora usa o ponto de aproximação mais próximo e forma uma pequena barreira animada que expande e dissipa; impactos absorvidos reforçam o setor correspondente.
- Encouraçado: os quatro setores mantêm indicação discreta em repouso e respondem a impactos com pulsos regionais mais evidentes.
- Tropas de elite: os segmentos de escudo recebem uma expansão/flash curto quando absorvem dano.
- A camada visual não participa da decisão de colisão ou dano; não foi criada esfera contínua, sistema de partículas por quadro ou alteração de integridade/recarga.
- Pendente: validação manual de múltiplas ameaças, orientação, zoom e fluidez em dispositivos reais; depois ajustar tempos e intensidade visual com feedback de gameplay.


## Geometria de colisão do laser contínuo — 30/10/2026
- [x] O feixe considera a soma entre a meia-largura visual e o raio físico do alvo em colisões com projéteis inimigos.
- [x] O feixe considera o raio de colisão da entidade, incluindo o footprint do encouraçado, evitando falsos negativos nas bordas.
- [ ] Validar em gameplay os contatos tangenciais contra projéteis, inimigos comuns e boss; confirmar que a colisão acompanha a leitura visual.
- A alteração não modifica valores de dano, cadência, alcance ou duração.


## Canhão principal de energia — telemetria visual v0.44.0
- [x] Ativar a carga visual apenas nas fases II/III e depois da entrada cinematográfica.
- [x] Exibir progresso de carga no HUD tático, com aviso de energia crítica ao concluir a preparação.
- [x] Reforçar visualmente o núcleo e o anel do canhão frontal durante carga e alerta.
- [x] Desativar a telemetria quando o módulo é destruído/inoperante; permitir retomada após reparo/reconstrução.
- [x] Preservar o canhão como sistema exclusivamente visual: nenhum projétil, dano, feixe ofensivo ou habilidade de Attack Clash é criado.
- [ ] Validar leitura do indicador e alerta em celular/desktop, incluindo zoom tático 0,5 e preferência de movimento reduzido.
- [ ] Confirmar em gameplay que o ciclo não altera a cadência dos demais armamentos nem cria dano indireto.


## Expansão adicional da arena e enquadramento tático — 30/10/2026
- [x] Aumentar o mundo físico de 2,0× para 2,4× o viewport em cada eixo, totalizando 5,76× a área de um viewport.
- [x] Calcular o zoom mínimo como `1 / arenaScale`, mantendo o mapa inteiro enquadrado durante e após o encontro com o chefe.
- [x] Aplicar o mesmo zoom mínimo à câmera, renderização, conversão mouse/toque e cálculo de spawn baseado na área visível.
- [x] Aumentar a amplitude de reposicionamento horizontal do encouraçado para manter o flanqueamento perceptível no novo enquadramento.
- [ ] Validar movimento até os quatro limites da arena e confirmar que a câmera não revela áreas fora do mundo.
- [ ] Validar mira por mouse, toque, joystick e teclado durante a transição de zoom.
- [ ] Confirmar em gameplay que o encouraçado oferece espaço e tempo suficientes para flanquear e atingir os quatro setores de escudo.
- [ ] Medir memória, tempo de renderização e FPS em dispositivos reais; não inferir desempenho a partir do CI.


## Desprendimento estrutural da destruição — 30/10/2026
- [x] Ejetar quatro placas de blindagem em tempos escalonados durante a sequência de 8,4 s.
- [x] Dar deriva lateral e rotação própria aos fragmentos, preservando leitura de peças estruturais separadas do casco.
- [x] Encerrar a visibilidade dos fragmentos antes da remoção final do destroço.
- [x] Usar desenho determinístico sem criar coleções, entidades ou partículas por quadro.
- [ ] Validar em gameplay a leitura dos fragmentos com o zoom tático e a deriva do casco.
- [ ] Confirmar que os fragmentos não parecem projéteis ativos nem interferem em colisões ou recompensas.


## Refinamento integrado do encouraçado — candidata v0.44.0
- [x] Ampliar a escala visual do casco e reforçar a leitura de nave capital com sponsons laterais e dois propulsores de popa.
- [x] Aumentar a patrulha lateral e manter a proa afastada da posição do piloto durante o encontro.
- [x] Usar colisão elíptica orientada para casco, projéteis, mísseis e contato do jogador.
- [x] Melhorar a legibilidade do HUD tático em telas móveis.
- [x] Adicionar 9 testes automatizados de geometria, módulos, escudos, sobrecarga/reconstrução e disparos do boss.
- [ ] Validar visualmente o design e o HUD em celular e computador.
- [ ] Testar flanqueamento, colisões, dano regional, reconstrução, Attack Clash, habilidades do jogador e desempenho.
- [ ] Abrir a prévia somente após revisão integrada e autorização explícita do usuário.

### Estado da rodada
- HEAD: `4542afa81c682bcb7b5f6ea5a8efe937b3f979ab`.
- CI aprovado: [run 41075516210](https://github.com/claudiohenriky/GALACTIC-DEFENDER/actions/runs/41075516210).
- Os checks incluem sintaxe, testes unitários, imports e whitespace; não comprovam aparência, gameplay ou FPS.
- PR #78 continua Draft e a prévia permanece fechada.

- [x] Integrar o Laser Contínuo à colisão elíptica orientada do encouraçado, incluindo proa, popa e rotação.
