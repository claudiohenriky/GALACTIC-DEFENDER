## [0.54.6] — rebalanceamento de combate e IA do DREADNOUGHT

- Reduz a pressão das tropas comuns: Interceptador, perseguidor e Guardião ficam menos velozes; Sentinela e Artilheiro recebem ajustes mais fortes de mobilidade, esquiva, vida, cadência e dano.
- Sentinela básico dispara com menor dano e maior intervalo; a variante Elite continua com salva dupla, mas menos punitiva e com maior janela de reação.
- Artilheiro passa de três para dois projéteis por salva, com dano e velocidade menores, intervalo maior e faixa de patrulha mais contida. A variante Elite mantém dois tiros mais fortes e o escudo próprio.
- O DREADNOUGHT não usa esquiva de tropas contra tiros do jogador; reposicionamento lateral e estabilização ficam mais curtos, a rotação do casco responde melhor e a cadência de ataque aumenta gradualmente por fase.
- Mísseis continuam sendo priorizados a longa distância; lançadores mantêm alcance de 980. O plasma mantém velocidade de 760 e repulsão pesada já definida.
- O renderer do encouraçado agora respeita a escala adaptativa de efeitos: em qualidade reduzida, substitui o gradiente dos propulsores por preenchimento sólido, preservando a silhueta.
- **Validação automatizada:** testes de balanceamento, mobilidade, cadência, esquiva do boss e armamento adicionados. Playtest mobile/desktop e medição real de FPS continuam pendentes.

## [0.54.5] — notificações táticas e posicionamento de diálogo

- Substitui os emojis grandes de reação por indicadores vetoriais compactos, com moldura técnica azul/ciano e glifos desenhados em Canvas.
- Diferencia suspeita, perigo e ameaça Elite por forma e intensidade, mantendo a mesma linguagem visual.
- Adiciona entrada rápida, pulsação leve e desaparecimento suave; preserva os gatilhos de alerta e o disparo único por transição de ameaça.
- Reposiciona o cartão de fala do DREADNOUGHT para uma lateral livre do casco em telas largas; em telas estreitas, escolhe uma posição vertical ou de borda adaptativa.
- Preserva a cutscene, os diálogos, a câmera, a arena e a lógica de combate.
- **Validação automatizada:** 72/72 testes aprovados, sintaxe JavaScript, imports relativos e whitespace aprovados. Validação visual em Android/desktop ainda pendente.

## [0.54.4] — refinamento visual dos cartões de diálogo

- Preserva o formato, o tamanho e a hierarquia dos cartões aprovados na v0.54.3.
- Reduz a saturação e o brilho do azul usado na identificação “COMUNICAÇÃO”, mantendo uma assinatura visual própria para o piloto.
- Adiciona três barras de sinal com pulsação suave, um brilho de varredura discreto no cabeçalho e pequenos traços técnicos nos cantos.
- Mantém as animações leves, sem sombras desfocadas por quadro, sem alterar a legibilidade, o posicionamento ou o fluxo da cutscene.
- Preserva as falas, a entrada, a distância aprovada, a câmera, a arena e o combate.
- **Validação automatizada:** 69/69 testes aprovados, sintaxe JavaScript, imports relativos e whitespace aprovados. Validação visual em Android/desktop ainda pendente.

## [0.54.3] — diálogos e cartões cinematográficos

- Reescreve as falas do piloto, do sistema de bordo e do DREADNOUGHT para criar uma progressão mais natural: setor aparentemente limpo, anomalia, contato visual, ameaça e identificação.
- Ajusta as frases para uma comunicação mais direta e coerente com a situação de cada personagem.
- Amplia os cartões em telas pequenas e aumenta a tipografia mobile; agora o texto pode ocupar até quatro linhas em vez de ser cortado após duas.
- Centraliza o cálculo de quebra de linhas em uma função testável e adiciona testes para preservar o texto completo e limitar o cartão.
- Preserva a entrada, a distância aprovada, a câmera, a arena e a duração geral da cutscene.
- **Validação automatizada:** 68/68 testes aprovados, sintaxe JavaScript, imports relativos e whitespace aprovados. Validação visual em Android/desktop ainda pendente.

## [0.54.2] — ajuste de distância na entrada do DREADNOUGHT

- Ajusta o ponto final da aproximação para usar exatamente o mesmo afastamento vertical definido pela IA de combate.
- Aumenta o espaço visível entre o casco e a nave do piloto e evita uma mudança brusca de posição quando a cutscene entrega o controle ao combate.
- Preserva a trajetória central, a duração da revelação, a câmera, os diálogos e a arena aprovados.
- Adiciona teste de regressão para garantir que a posição final cinematográfica corresponda ao alvo de combate.
- **Validação automatizada:** 65/65 testes aprovados, sintaxe JavaScript, imports relativos e whitespace aprovados. Validação visual em Android/desktop ainda pendente; não há alteração de balanceamento ou armamentos.

## [0.54.1] — correções de apresentação da cutscene do DREADNOUGHT

- **Patch corretivo da v0.54.0:** preserva a sequência e a duração das fases; não representa uma nova versão minor de funcionalidades.
- Corrige o fluxo dos diálogos: cada fala recebe tempo suficiente para terminar antes da próxima, inclusive a frase “Parece tranquilo” e a resposta inicial do piloto à anomalia.
- Aproxima os cartões existentes do jogador: piloto à esquerda e sistema de bordo à direita, ambos ancorados na posição da nave. O design aprovado dos cartões foi preservado.
- Reestrutura a apresentação da câmera: mantém o piloto centralizado nos diálogos, trava o eixo horizontal durante a revelação e abre o enquadramento progressivamente para mostrar chefe e jogador. Uma fase final amplia discretamente a visão da arena; o zoom de combate permanece em 0,54, sem reduzir o piloto a um ponto.
- Centraliza o aviso de identificação do chefe no alto da tela: ele surge com fade-in e sai deslizando para cima após a confirmação.
- Simplifica apenas os indicadores: o ❓ agora é um símbolo vermelho sem círculo azul; o ❗ mantém o destaque vermelho. O ❓ permanece por 8,5 segundos e o ❗ por 30 segundos. Os cartões de diálogo não foram simplificados.
- Reativa os sinais diegéticos na cutscene: ❓ para a anomalia, ❗ durante a revelação do chefe e ❓❗ para alertas de tropas de Elite.
- Corrige a comparação temporal dos alertas para tolerar pequenas diferenças de ponto flutuante e adiciona testes de regressão.
- Corrige o travamento da cutscene ao ativar os indicadores do piloto: o renderizador agora recebe explicitamente o estado da reação e as coordenadas de tela, tanto durante a cinemática quanto no combate.
- Ao cobrir a tela com o loading, reposiciona o jogador, restaura vida/escudo e limpa projéteis e entidades do confronto anterior, sem substituir a nave nem apagar XP, nível, pontuação, classe ou melhorias adquiridas.
- Garante uma distância de segurança entre o casco do DREADNOUGHT e o jogador; o chefe desce pelo eixo central e não atravessa a nave do jogador.
- Preserva o sistema de reações introduzido na v0.49.0: alertas de perigo continuam ligados às telemetrias do canhão principal e dos canhões de plasma do DREADNOUGHT, com acionamento por transição para evitar piscadas repetidas.
- Adiciona testes de regressão para o desenho dos indicadores, a transição de ameaça e a integração do renderizador.
- **Validação automatizada:** sintaxe JavaScript, 65 testes, imports relativos e whitespace aprovados no GitHub Actions. A inspeção visual em celular/desktop ainda está pendente.

## [0.54.0] — nova cinemática, chefes recorrentes e revisão de desempenho

- Substitui o controlador antigo da transição da onda 9 para 10 por uma sequência independente, com fade do HUD, carregamento de 10 segundos, diálogos com intervalos definidos, alerta anônimo, revelação distante e identificação final do DREADNOUGHT.
- A cinemática passa a ser a única proprietária da câmera e da apresentação do chefe até o handoff. O DREADNOUGHT não recebe atualizações de IA durante a cena; seu temporizador de entrada é finalizado antes do primeiro quadro de combate.
- Remove os módulos antigos `wave-ten-transition.js` e `boss-camera.js`. A função de posicionamento de combate foi separada em `boss-positioning.js`, e a preparação do handoff pertence ao novo módulo de câmera cinematográfica.
- Ajusta a cadência de chefes para as ondas 10, 20, 30, 40...; ondas intermediárias como 15 e 25 voltam a ser ondas normais. As aparições posteriores à primeira usam falas breves de reconhecimento, sem repetir a introdução longa.
- Reduz varreduras redundantes de projéteis na IA de Sentinelas e Artilheiros para uma verificação a cada 0,16 s quando não há cooldown ativo.
- Limita partículas de dano e partículas de evolução a listas com tamanho máximo controlado; efeitos de mísseis e quebra de escudo já tinham limites próprios e foram mantidos.
- Adiciona testes de regressão para o novo fluxo temporal, enquadramento da câmera, transferência para IA e recorrência de chefes.
- **Validação pendente:** a branch ainda precisa passar pela suíte automatizada e por teste visual em navegador. Nenhum ganho de FPS foi medido nesta alteração.

## [0.53.2] — correção de câmera no handoff e sinais da cutscene

- Corrige a causa visual restante após a cutscene: o enquadramento cinematográfico terminava em zoom e posição de câmera diferentes dos limites usados por `updateCamera()`. A câmera agora converge para o mesmo zoom mínimo e para os mesmos limites durante o diálogo final, antes de liberar a simulação normal.
- Mantém o temporizador interno de entrada do DREADNOUGHT encerrado no handoff, preservando a correção anterior.
- Reposiciona os sinais de reação do piloto para evitar sobreposição com balões de diálogo e substitui os glifos de emoji por ícones vetoriais com moldura própria.
- Reforça a rolagem vertical do histórico em dispositivos móveis e registra a etapa v0.51.0.
- **Validação pendente:** testes automatizados e teste visual no navegador/celular ainda precisam ser executados.

## [0.53.1] — correção do handoff e histórico de versões

- Corrige a causa do deslocamento após a cutscene: o DREADNOUGHT é construído antes de entrar na lista normal de inimigos, portanto seu temporizador interno de entrada continuava ativo ao terminar o diálogo. O primeiro quadro de IA repetia a descida cinematográfica. O handoff agora encerra esse temporizador explicitamente antes de liberar a IA.
- Centraliza a preparação do chefe para combate em uma função testável e adiciona regressão para temporizador, posição, alvo, estado e velocidade.
- Consolida no histórico visível do menu os marcos de desenvolvimento posteriores à v0.44.0, sem apagar os registros anteriores.
- Atualiza o identificador de versão e os parâmetros de cache para v0.53.1.
- **Validação pendente:** a suíte automatizada e o teste visual em navegador/celular ainda precisam ser executados.

## [Unreleased] — câmera cinematográfica e apresentação do DREADNOUGHT

- Ajusta o enquadramento da câmera durante a transição da onda 9 para a onda 10: começa próximo do piloto, recua gradualmente durante o alerta e enquadra piloto e encouraçado na revelação.
- Durante o combate contra o DREADNOUGHT, desloca o foco vertical para a região entre jogador e chefe, reduzindo cortes da silhueta sem alterar dimensões do mundo, hitboxes ou colisões.
- Substitui o painel de diálogo grande por balões compactos ancorados ao piloto ou ao chefe, com uma fala por vez e quebra de linha responsiva.
- Mantém a tela de carregamento, bloqueia a simulação de combate durante a apresentação e libera o chefe somente no handoff final.
- Adiciona testes unitários para os enquadramentos cinematográficos em telas largas e estreitas. Validação visual em navegador/celular/desktop ainda pendente.

## [Unreleased] — v0.49.0 · reações do piloto e alertas de ameaça

- Adiciona reações diegéticas da nave: ❓ para surpresa diante da chegada do DREADNOUGHT e da primeira aparição de cada classe de Elite; ❗ para sinalizar ataques perigosos.
- Conecta o alerta de perigo ao aviso do canhão principal do DREADNOUGHT, somente quando a linha de disparo ameaça a posição do jogador.
- Detecta a janela final de telemetria dos canhões de plasma e verifica a trajetória prevista contra a área da nave do jogador antes de exibir o alerta.
- Os avisos são acionados por transição de ameaça, evitando piscadas contínuas; a reação aparece ao lado da nave com animação curta e desaparecimento gradual.
- Adiciona testes unitários para duração das reações e acionamento único dos alertas.
- **Validação pendente:** executar a suíte automatizada e testar visualmente cutscene, tropas de Elite e ataques do DREADNOUGHT em navegador; ainda não houve playtest.

## [Unreleased] — v0.48.0 · transição cinematográfica do DREADNOUGHT

- Corrige a passagem da cutscene para o combate: o temporizador interno de entrada do chefe é finalizado no handoff, impedindo que a IA reproduza a descida cinematográfica depois do diálogo final.
- Amplia a área vertical das caixas de diálogo e adapta tamanho de fonte/entrelinha à altura da tela, reduzindo o risco de texto cortado em celulares na horizontal.
- Adiciona teste de regressão para o handoff entre apresentação e IA normal do chefe.
- **Validação pendente:** executar a suíte automatizada e testar a transição em celular e desktop; nenhuma validação de navegador foi realizada nesta alteração.

## [Unreleased] — Rebalanceamento de combate e IA do DREADNOUGHT

- Reduz a pressão geral das tropas comuns: deslocamento do Interceptador e do perseguidor mais contido, Guardião menos veloz e perfis básicos de Sentinela/Artilheiro revistos.
- Sentinela básico recebe novo ajuste de velocidade, esquiva, faixa lateral, cadência e dano; Elite continua superior, mas com mobilidade ligeiramente reduzida.
- Artilheiro recebe nerf mais forte: menor velocidade/aceleração, faixa de patrulha menor, salva reduzida de três para dois projéteis, cadência mais lenta e projéteis menos rápidos/danosos.
- Corrige a esquiva involuntária do DREADNOUGHT: projéteis do jogador deixam de acionar deslocamento evasivo lateral do boss.
- Reposicionamento do encouraçado passa a ser lateral, sem vetor de afastamento do jogador; estabilização mais curta, cooldown menor e rotação do casco mais responsiva.
- DREADNOUGHT acelera a cadência de combate e prioriza mísseis teleguiados em distâncias maiores; alcance dos lançadores ampliado para 980 unidades.
- Canhões de plasma acelerados de 620 para 760 unidades/s; repulsão do impacto aumentada para 1.050 com escudo ativo e 1.450 sem escudo.
- Testes de regressão adicionados para mobilidade das tropas, ausência de esquiva do boss e armamento de longo alcance.
- **Validação pendente:** testes automatizados e playtest real no navegador; valores de dificuldade ainda são candidatos até a confirmação do usuário.

## [Unreleased] — DREADNOUGHT · escudos e legibilidade dos módulos

- Reduz a integridade dos quatro setores regionais e alonga suas janelas de recarga para tornar o combate contra as defesas mais legível.
- Disparos que atingem diretamente um hardpoint transferem 42% do dano ao módulo mesmo com o escudo regional ativo; impactos no casco continuam sendo absorvidos normalmente.
- Reforça a leitura dos quatro arcos de escudo com camadas ciano mais visíveis, mantendo a geometria segmentada.
- Amplia visualmente plasma, lançadores de mísseis, canhão pesado e metralhadoras em proporções diferentes. As alterações são exclusivamente visuais e não modificam alcance, dano, cadência ou colisões.
- Adiciona testes de regressão para penetração controlada em hardpoints e absorção integral de impactos comuns no casco.
- **Validação pendente:** confirmar em gameplay real a precisão do ponto de impacto, a taxa de destruição dos módulos e a legibilidade das armas no zoom tático.

## [Unreleased] — DREADNOUGHT · IA tática e revisão do arsenal

- Define alcances operacionais por módulo e restringe a mira/disparo dos armamentos laterais ao respectivo lado do casco; metralhadoras mantêm capacidade de cobertura cruzada por serem armas de longo alcance.
- Amplia a bateria de plasma para quatro canhões independentes, dois em cada lateral, mantendo IDs e integridade individual por hardpoint.
- Cada canhão de plasma possui ciclo de carga de 5,4 s, com telemetria visual intensa nos 1,5 s finais para indicar a preparação do disparo.
- O projétil de plasma passa a viajar em alta velocidade (620 unidades/s), com 68 pontos de dano e impacto pesado.
- Ao acertar, o plasma remove imediatamente o escudo ativo; sem escudo, aplica dano elevado. O impacto também arremessa o jogador, com impulso reduzido quando o escudo absorve o golpe.
- Adiciona cobertura de teste para a quantidade de módulos, distribuição dos quatro canhões e configuração de alcance/telemetria.
- **Validação pendente:** verificar alinhamento visual dos quatro novos hardpoints, legibilidade da carga, tempo real de reação, colisão do projétil, impacto/knockback e equilíbrio em gameplay. Não houve teste manual de navegador nesta etapa.

## [Unreleased] — v0.45.0 · movimentação precisa e IA tática

- Define a substituição da movimentação excessivamente orgânica por controles mais precisos e previsíveis, com física, decisão tática e animação visual separadas.
- Tropas comuns poderão buscar posições melhores e cooperar sem perder suas funções-base; o Interceptador permanece a unidade mais básica, com perseguição veloz e sem habilidade especial própria.
- Flanqueamento coordenado e leitura tática avançada ficam reservados às tropas de Elite existentes: Sentinela, Guardião e Artilheiro. Não existe Interceptador de Elite.
- O DREADNOUGHT terá controlador próprio, baseado em controle de distância, reposicionamento, proteção de ângulos de armamento e ataques antecipatórios com aviso e oportunidade de reação.
- Cria `src/movement/motion.js`, núcleo compartilhado sem alocações por quadro para aproximação de velocidade e integração de posição.
- Migra a movimentação do jogador para o núcleo compartilhado; aceleração sobe de 1800 para 2400 unidades/s², mantendo a velocidade máxima de 250 e a normalização diagonal. A resposta de reversão fica mais rápida sem alterar velocidade de cruzeiro.
- Adiciona testes para consistência em 30/60/120 FPS, reversão sem overshoot, delta inválido, movimento diagonal e limite de velocidade.
- A inclinação visual, a rotação, os efeitos de propulsão e a câmera permanecem separados da integração física.
- Migra Sentinelas e Artilheiros normais/Elite para steering com aceleração, velocidade máxima por perfil e frenagem proporcional à distância até o ponto de combate.
- Perfis Elite têm capacidades de reposicionamento superiores às versões comuns. O Interceptador continua usando perseguição simples, sem perfil de flanqueamento ou variante Elite.
- Adiciona coordenador tático dedicado que escolhe uma única Elite por vez, prioriza Sentinelas, seleciona o corredor traseiro menos congestionado e respeita intervalo entre manobras.
- Sentinelas e Artilheiros Elite suspendem os disparos durante o reposicionamento; Guardião Elite não abandona aliados vivos que estejam sob sua proteção.
- Tropas comuns recebem uma segunda camada mais simples: um Chaser por vez pode procurar uma posição lateral menos congestionada, sem previsão de trajetória ou manobra traseira; ele também segura o disparo durante a reposição.
- A coordenação comum aguarda quando um flanqueamento Elite está ativo. Interceptadores não entram em nenhuma dessas decisões e mantêm perseguição direta.
- DREADNOUGHT recebe estados de patrulha, reposicionamento pesado e estabilização. Ao detectar o jogador fora de seu arco frontal ou próximo demais, escolhe uma posição lateral/oblíqua em vez de tentar persegui-lo diretamente.
- O chefe usa perfil de aceleração e velocidade máxima próprios e antecipa moderadamente a posição do jogador ao orientar as torres, usando sua velocidade atual como estimativa limitada.
- Adiciona testes para movimento pesado, limite de velocidade, reposicionamento quando o jogador sai do arco frontal e diferença de mira contra um alvo em movimento.
- **Estado:** primeira fundação integrada ao jogador, Sentinelas, Artilheiros, Chasers, coordenação Elite e movimento inicial do DREADNOUGHT. O Guardião também foi migrado para steering compartilhado na formação e no fallback sem aliados; a lógica avançada de controle de áreas/ataques antecipatórios do DREADNOUGHT continua pendente. Teste manual ainda não realizado.

## [Unreleased] — Progressão normal de ondas e preparação da revisão de movimentação

- Desativa o modo temporário que fazia o DREADNOUGHT surgir já na primeira onda; a partida volta a começar com cinco inimigos e segue a progressão normal.
- Mantém o DREADNOUGHT programado para as ondas especiais a partir da onda 10, com recorrência a cada cinco ondas.
- Adiciona teste de regressão para o início da partida e a transição entre as ondas 9, 10 e 11.
- Inicia a auditoria da jogabilidade: preservar a movimentação orgânica do jogador e investigar separadamente aceleração, inércia, rotação, inclinação visual, câmera e deslocamento do encouraçado.
- **Escopo:** ajuste do modo de teste e cobertura da progressão; nenhuma física ou parâmetro de movimentação foi alterado nesta etapa.
- **Validação pendente:** executar a suíte automatizada e testar a progressão real no navegador antes de iniciar ajustes físicos.

## [Unreleased] — DREADNOUGHT · proa limpa e otimização de renderização

- Remove a antiga passagem de desenho do casco que continuava sendo renderizada por baixo do novo modelo em camadas; o DREADNOUGHT passa a ter uma única passagem principal de casco.
- Remove a superestrutura central elevada e os detalhes cinza da ponte na proa, mantendo a linha central limpa e reta entre a cavidade aberta do emissor e a ponta da nave.
- Preserva os detalhes laterais, os condutores de energia e a cavidade frontal; nenhum canhão físico ou peça central foi recolocada.
- Substitui gradientes criados a cada quadro por preenchimentos sólidos controlados na carcaça, no reator e na cavidade. O contraste passa a vir principalmente da geometria e das placas.
- Remove arrays temporários de coordenadas em loops do desenho do boss e mantém as armas como módulos independentes.
- **Escopo:** renderização visual e eficiência do desenho; IA, posições dos módulos, mira, cadência, projéteis, dano, escudos, hitboxes e colisões permanecem inalterados.
- **Validação pendente:** verificar a leitura da proa e das armas no jogo e medir FPS/tempo de quadro no mesmo aparelho. A redução de operações de desenho é verificável no código; ganho de FPS ainda não foi medido.

## [Unreleased] — DREADNOUGHT · legibilidade do armamento

- Redesenha as silhuetas visuais das metralhadoras, lançadores de mísseis, lasers leves e canhões de plasma, com receptores blindados, bocais/tubos rebaixados e detalhes de emissor próprios por família.
- Amplia moderadamente os hardpoints e reforça o contraste entre a base mecânica e a arma instalada, mantendo os módulos desenhados acima do casco para evitar que a nova superestrutura os esconda.
- Mantém posições, IDs, ângulos, arcos de mira, cadência, projéteis, dano, integridade dos módulos, transições e colisões. O canhão principal continua representado pela cavidade frontal aberta.
- A renderização continua sendo Canvas 2D com geometria vetorial em camadas; não foram adicionadas malhas 3D, filtros de sombra ou gradientes por arma.
- **Validação pendente:** conferir leitura à distância e em telas pequenas, possíveis sobreposições entre hardpoints, transições de substituição e desempenho real em celular/desktop.

## [Unreleased] — DREADNOUGHT · propulsores e canhão principal

- Remove o núcleo quase branco dos propulsores, que podia parecer uma peça separada; os bocais passam a usar uma escala de cianos coerente com a identidade energética da nave.
- Substitui a chama rígida em blocos por plumas vetoriais cônicas e suaves, mantendo os dois motores principais visualmente independentes.
- Refina os propulsores auxiliares com núcleo ciano e halo azul-petróleo, sem acrescentar novos elementos brancos.
- Redesenha o encaixe do canhão principal com câmara rebaixada, blindagem octogonal, anéis de contenção, dentes de travamento e lente emissora ciano pulsante.
- Preserva a posição e o módulo funcional do canhão, além de IA, dano, cadência, escudos, colisões e demais sistemas.
- **Validação pendente:** conferir se o detalhe do canhão permanece legível sob o módulo de arma, se os propulsores estão equilibrados e se o brilho não satura em telas pequenas.

## [Unreleased] — DREADNOUGHT · COLOSSAL WARSHIP — redesign tridimensional

- Retorna o boss à renderização vetorial suave do jogo; a experiência de pixel art permanece apenas como estudo visual e não é usada nesta implementação.
- Redesenha a apresentação do DREADNOUGHT com geometria em camadas, laterais facetadas, sombras projetadas, chanfros, gradientes direcionais e superestrutura elevada para criar volume 3D em perspectiva superior 2D.
- Adiciona ponte de comando escalonada, encaixe frontal do canhão principal, poço de reator ciano com iluminação radial, segmentação de blindagem, rebites, grelhas e propulsores auxiliares.
- Preserva o grafite fosco, o aço escovado, o núcleo ciano, os armamentos de plasma laranja e os traços verdes localizados da fase adaptativa.
- Atualiza a identificação de entrada e o alerta da arena para **DREADNOUGHT — COLOSSAL WARSHIP**.
- Mantém os dez módulos, escudos regionais, IA, movimento, dano, cadência, colisões, hitboxes e transições de fase sem alterações intencionais.
- **Validação pendente:** conferir leitura da silhueta, profundidade dos volumes, sobreposição dos hardpoints, efeitos de dano, escala em celular e desempenho em computador.

## [Unreleased] — Nitidez da pixel art e propulsores do Encouraçado

- Aumentada a resolução interna da arte de 80 × 104 para 100 × 144 pixels, com ampliação exata de 4× e suavização desativada para bordas mais definidas.
- Ampliado o enquadramento vertical do sprite para acomodar os dois jatos traseiros sem cortar a chama.
- Substituído o escape central genérico por dois propulsores independentes, com carcaças, bocais e chamas em blocos de pixels ciano, branco e laranja.
- Reorganizados os bocais para evitar sobreposição visual entre a grelha traseira, a blindagem e as chamas.
- **Escopo:** ajuste visual; IA, movimento, dano, cadência, colisões e sistemas de combate permanecem inalterados.
- **Validação pendente:** verificar nitidez em diferentes escalas, alinhamento dos dois propulsores e desempenho em celular.

## [Unreleased] — Encouraçado em pixel art

- Converte toda a renderização do Encouraçado para uma superfície pixelada reutilizável de baixa resolução, ampliada com amostragem nearest-neighbor para formar blocos de pixels nítidos.
- Afina visualmente a silhueta em 18%, preservando o enquadramento, as dimensões físicas e as regras de colisão existentes.
- Adiciona placas laterais serrilhadas, dentes de blindagem, marcações de alerta e grelhas de exaustão em blocos de cor.
- Preserva os dez hardpoints, os estados dos módulos, os escudos regionais, as animações de dano, reconstrução e destruição.
- **Escopo:** alteração exclusivamente visual; nenhum dano, cadência, IA, movimento ou hitbox foi alterado.
- **Validação pendente:** conferir a leitura dos pixels, a silhueta mais estreita, a legibilidade dos módulos e o desempenho em celular e computador.

## [0.44.0] — Modo temporário de teste do Encouraçado

- Ativado o surgimento do Encouraçado já na onda 1, sozinho, para permitir testes imediatos do chefe durante o desenvolvimento.
- As ondas seguintes mantêm a progressão normal; o calendário original de chefes nas ondas 10, 15, 20... continua ativo.
- O modo fica centralizado em `BOSS_TEST_MODE` no gerenciador de ondas e deverá ser desativado quando o desenvolvimento do Encouraçado for concluído.
- **Validação pendente:** confirmar início da partida, entrada do chefe na onda 1, derrota e avanço correto para a onda 2.

## [0.44.0] — Identidade visual do Encouraçado

- Reconstruída a silhueta como nave capital completa, com casco largo, blindagem grafite fosca e reforços em aço escovado.
- Integrado ao casco um canal longitudinal de energia ciano, conduzindo visualmente ao canhão principal fixo.
- Reposicionados os dez hardpoints para distribuir armamentos pelas laterais, proa e região central.
- Diferenciadas as identidades cromáticas: energia ciano, plasma laranja-avermelhado e traços verdes localizados durante a reconstrução adaptativa da fase III.
- Preservadas as rotinas de combate, estados dos módulos, escudos, sobrecarga, dano e IA; as coordenadas dos hardpoints foram atualizadas junto à disposição física.
- **Validação pendente:** teste visual e de combate em navegador, incluindo hardpoints, colisões dos módulos e enquadramento em celular.

## [0.44.0] — Primeiro chefe: nave de guerra pesada (em desenvolvimento)

- Corrige a geometria de colisão do laser contínuo: o teste agora considera o raio real de projéteis inimigos e entidades (incluindo a hitbox ampliada do boss), somado à largura do feixe. Isso evita falsos negativos em interseções visíveis sem alterar dano, cadência ou alcance.
- Canhão principal frontal: adiciona ciclo visual de carga, progresso no HUD tático e alerta de energia crítica nas fases II/III. Não há disparo, projétil, dano ou habilidade de Clash nesta etapa; é apenas preparação visual e telemetria.

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

- Refinamento do HUD do encouraçado: os dez indicadores de armamento agora exibem abreviações identificáveis em uma grade 5×2, mantendo cores e estados distintos; os nomes completos permanecem disponíveis nos rótulos acessíveis e dicas.

- Corrige a resolução de dano do encouraçado para que habilidades especiais, laser contínuo e ataques de área sem coordenada de impacto explícita atinjam o setor de escudo voltado para o jogador, em vez de ignorarem a defesa regional.
- Reutiliza o snapshot de integridade do HUD por instância de chefe, evitando recriar objetos de comparação em cada atualização da interface.


## v0.44.0 — rodada de reformulação do encouraçado

- Alongada a silhueta do encouraçado e adicionadas geometrias visuais distintas para as famílias de armamentos.
- Sobrecarga adaptativa preserva módulos intactos, repara os danificados, reconstrói armamentos destruídos recuperáveis e substitui somente montagens classificadas como catastróficas.
- Arena ampliada para 2× o viewport; zoom de 0,5 enquadra o mapa completo após o surgimento do chefe e permanece até o reinício da partida.
- Rotação visual do casco reduzida para reforçar a sensação de massa. Mira independente das torres, IA de mísseis, entrada com alerta e finalização estendida permanecem em desenvolvimento.


- Torres do encouraçado agora acompanham o jogador de forma independente, respeitando arcos e velocidades de rotação próprios.
- Lançadores do boss passam a disparar projéteis teleguiados.
- Attack Clash agora considera resistência dos projéteis inimigos, evitando que ataques pesados sejam neutralizados por um único disparo leve.


## [Unreleased] — Balanceamento dos mísseis do DREADNOUGHT

- Mísseis roxos confirmados como projéteis teleguiados dos lançadores laterais. A salva agora dispara apenas um míssil, alternando a asa quando ambos os lados têm linha de tiro.
- Cadência separada por cooldown: 5,2 s na fase 1, 4,8 s na fase 2 e 4,4 s na fase 3. Velocidade/dano sobem gradualmente de 185/12 para 225/15, com curva de perseguição moderada.

## [Unreleased] — IA tática e canhão principal do DREADNOUGHT

- Cada salva agora escolhe uma família de armas com base na distância, alcance real, lado do jogador, integridade dos módulos e disponibilidade de carga; armas indisponíveis não participam da seleção.
- O canhão principal ganhou ciclo completo de carga, alinhamento, aviso, disparo e recuperação. O casco acelera o alinhamento, trava a direção durante o aviso e não persegue o jogador depois de fixar a linha de tiro.
- O feixe possui corredor visual antecipado, duração curta e colisão calculada no mesmo segmento usado pela renderização. O jogador pode sair da linha durante o aviso; cada disparo pode causar no máximo um impacto.
- A destruição/inoperância do módulo principal cancela o ciclo e impede o disparo.
- Validação automatizada cobre seleção por alcance/lado/estado, geometria do feixe, transições e bloqueio por módulo destruído. Teste visual e balanceamento em navegador continuam pendentes.

## [Unreleased] — Boss cinematográfico
- Limpa o estado temporário das animações de reparo, reconstrução e substituição dos módulos ao término de cada transição.

- Entrada do encouraçado mais longa, com armas bloqueadas durante o alerta e identificação visual integrada à nave.
- Sobrecarga com sinais visuais distintos para reparo, reconstrução e substituição de módulos.
- Derrota prolongada com perda de estabilidade, rotação e deriva do casco antes da remoção.


- Boss: canhões de plasma com carga independente e indicador de energia, projétil pesado de alto dano, ruptura imediata do escudo do jogador e repulsão forte no impacto.
- Combate: Pulso de Ruptura desestabiliza temporariamente inimigos, suspendendo a perseguição durante o recuo; impactos de plasma também comprometem temporariamente o controle de movimento do jogador.

- Corrige a consistência do arsenal: o canhão principal de energia deixa de causar dano/disparar nas fases 2 e 3 enquanto sua preparação visual e seu contra-jogo ainda não estão implementados; o armamento permanece como elemento visual/rastreamento nesta candidata.


### Escudos reativos — atualização visual inicial
- Jogador: setores preditivos agora apontam para a posição prevista de aproximação do projétil e formam uma barreira localizada com expansão e dissipação; o impacto absorvido reforça o setor correspondente.
- Encouraçado: os quatro setores regionais exibem pulsos localizados ao absorver dano, mantendo baixa presença visual em repouso.
- Tropas de elite: segmentos de escudo reagem com flash e expansão curta quando absorvem dano.
- Mantidas as regras atuais de proteção 360°, integridade, absorção, recarga e colisões; os efeitos são apenas visuais e não usam esfera permanente nem partículas por quadro.


### Expansão adicional da arena e enquadramento tático — 30/10/2026
- Mundo físico ampliado de 2,0× para 2,4× a largura e a altura do viewport (44% mais área de jogo).
- Zoom mínimo agora é derivado de `1 / arenaScale` em vez de um limite fixo de 0,5; o enquadramento integral acompanha automaticamente a dimensão real do mundo.
- Câmera, conversão de coordenadas de mouse/toque, spawn de inimigos, renderização e limites de visualização usam o mesmo zoom mínimo calculado.
- Aumentada a amplitude horizontal de reposicionamento do encouraçado para que o flanqueamento continue legível no enquadramento mais amplo.
- Nenhuma regra de dano, cadência, colisão, resistência de projéteis ou controle de nave foi alterada nesta etapa.
- Validação manual mobile/desktop e de flanqueamento ainda pendente; CI automatizado não será tratado como teste de gameplay.


### Desprendimento estrutural na destruição do encouraçado — 30/10/2026
- A finalização agora ejeta quatro placas de blindagem em momentos escalonados, com afastamento lateral, deriva e rotação independentes.
- Os fragmentos preservam uma silhueta metálica legível e uma linha interna de calor/falha, desaparecendo antes do encerramento da sequência.
- O efeito usa quatro transformações determinísticas no desenho existente; não cria arrays, entidades físicas ou partículas por quadro.
- Movimento, colisões e integridade do combate não são alterados; a validação visual da sequência completa permanece pendente.


### Revisão da proa e do sistema emissor do DREADNOUGHT — 30/10/2026
- Remove o canhão físico/barrel projetado na ponta da nave; o módulo lógico principal permanece no sistema, mas sua representação visual passa a ser a abertura central oca e permanentemente aberta.
- Redesenha a boca emissora como uma cavidade escura com borda de contenção segmentada. O laser futuro será carregado e lançado a partir desse vão, sem uma peça de canhão atravessando ou preenchendo a abertura.
- Adiciona manifolds laterais de energia com carcaças rebaixadas, conduítes ciano e pequenos nós capacitivos, preparados visualmente para uma futura animação de carga.
- Remove o realce quase branco/azul-claro do núcleo dos propulsores e mantém a paleta em ciano e azul-petróleo.
- Escopo exclusivamente visual: não altera disparos, dano, cadência, IA, hitboxes, colisões, escudos ou telemetria de carga. O laser principal continua sem disparo/dano nesta candidata.
- Validação visual em navegador, celular e desktop ainda pendente.


## [Unreleased] — Ajustes de reação do piloto, artilharia e proteção tática
- Simplifica os sinais de surpresa/perigo do piloto, removendo o emblema circular e os efeitos de pulso.
- O alerta de perigo é acionado pouco antes da identificação verbal do DREADNOUGHT.
- Restaura a salva de três projéteis do Artilheiro normal; reduz velocidade, aceleração, amplitude de deslocamento e impulso da esquiva lateral sem reduzir a quantidade de tiros.
- Reduz também a mobilidade evasiva do Sentinela básico e Elite, e contém o deslocamento lateral do Artilheiro Elite, preservando as funções e os padrões de ataque.
- Reorganiza a proteção dos Guardiões: Sentinelas e Artilheiros Elite têm prioridade máxima, as versões normais dessas classes vêm em seguida, e demais tropas recebem prioridade inferior.
- Limita a atribuição de proteção a aliados próximos e evita que mais de um Guardião assuma o mesmo alvo.
- Testes automatizados adicionados para a salva de três tiros, esquiva do Artilheiro e prioridade/distância das atribuições do Guardião. Validação de gameplay em navegador ainda pendente.

## [Unreleased] — Transição cinematográfica da onda 9 para a onda 10
- Adiciona um controlador de estados isolado para a passagem de campanha após a limpeza completa da onda 9.
- Carregamento de 10 segundos com telemetria rotativa, seguido de falas do piloto, alerta de contato desconhecido, entrada gradual do DREADNOUGHT e diálogo de ameaça.
- A sequência preserva pontuação, jogador e progressão; limpa apenas entidades e projéteis transitórios antes da entrada do chefe.
- A candidata está isolada em branch própria. A progressão normal continua disponível em uma branch de comparação, sem alterações na versão oficial.
- Validação automatizada da máquina de estados adicionada; teste visual e de gameplay ainda pendente.


## [Unreleased] — Balanceamento do Sentinela e preparação do teste da onda 9
- Reduz a mobilidade evasiva do Sentinela básico: velocidade máxima e aceleração menores, esquiva lateral menos intensa/curta e deslocamento de patrulha mais contido. O perfil Elite permanece inalterado nesta rodada.
- Adiciona início de onda configurável apenas por URL de teste; a campanha normal continua iniciando na onda 1.
- A branch da cutscene aceita testStartWave=9 para jogar a onda inteira antes da transição; a branch de gameplay normal não usa esse atalho.
- Testes automatizados adicionados para o perfil do Sentinela e a configuração da onda de teste. A validação em navegador e o ajuste fino de dificuldade continuam pendentes.


## [Unreleased] — Refinamento de impacto e aparição do DREADNOUGHT
- Adiciona um anel curto de impacto ao redor da nave do jogador quando ela recebe dano, separado das faíscas e do aviso de integridade; o efeito é posicional, leve e expira em 0,3 s.
- Limita o novo feedback a um único pulso ativo, sem criar entidades persistentes ou efeitos por quadro.
- Afasta a posição final da entrada do DREADNOUGHT de 0,62 para 0,92 da altura da tela em relação ao jogador; a posição inicial também recua para 1,42, mantendo a entrada gradual.
- Centraliza o cálculo das posições de entrada em uma função testável e reutiliza o mesmo cálculo após redimensionamento, evitando divergência entre telas.
- Não altera hitboxes, colisões, dano, velocidade, IA ou dimensões da arena. Validação visual em navegador ainda pendente.
