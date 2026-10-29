# GALACTIC-DEFENDER

Jogo de ação espacial para navegador, desenvolvido do zero com HTML, CSS e JavaScript puro.

## Estado do projeto

**Versão candidata publicada para validação:** `0.17.3` — mira automática no inimigo mais próximo, arraste manual quando a arena estiver vazia, retorno suave à direção frontal ao soltar o toque e disparo somente por comando do jogador. Aguarda validação manual no celular.

**Base funcional anterior:** `0.17.0`; a última versão com validação manual concluída é `0.16.2`, aprovada em celular com 6/6 testes.

**Fase:** pré-alfa. A v0.17.3 está em validação mobile; a mira automática prioriza inimigos sem disparar sozinha; o arraste manual orienta a nave quando a arena estiver sem inimigos; ao soltar o toque, a nave retorna suavemente à direção frontal.

- Plataforma: navegadores modernos em computador e celular.
- Controles: WASD/setas para movimentação, mouse para mirar, botão direito (segurar) ou Espaço para disparar no computador; joystick virtual para movimentar, mira automática no inimigo mais próximo e botão DISPARAR para atirar em dispositivos móveis. O disparo pelo botão direito foi aprovado no teste manual informado pelo usuário.
- Tela cheia: botão no canto superior da arena; em celulares, a orientação horizontal é recomendada.
- Compatibilidade inicial: navegadores modernos com suporte a Canvas e ES Modules.
- Publicação: GitHub Pages via GitHub Actions.
- Estrutura modular, sem frameworks ou dependências externas.

## Lobby e plataforma

- O menu principal separa o lobby da arena e oferece acesso a Jogar, Configurações e Sobre o jogo.
- A preferência PC/mobile é detectada automaticamente na primeira visita e pode ser alterada manualmente; a escolha fica salva no navegador.
- As configurações de tamanho e transparência da HUD são aplicadas à interface e persistidas localmente. O áudio é gerado localmente com Web Audio API; a preferência de áudio pode ser ativada/desativada e o volume geral ajustado nas configurações.
- O armazenamento é local ao navegador e não sincroniza preferências entre dispositivos.

## Executar localmente

Como o projeto usa módulos JavaScript, abra a pasta com um servidor HTTP local (por exemplo, a extensão Live Server do VS Code). Abrir `index.html` diretamente como `file://` pode bloquear os módulos.

## Controles

- **PC (candidata 0.17.0):** mouse para mirar; `W/S` avançam e recuam em relação à orientação da nave; `A/D` fazem strafe; botão direito (segurar) ou `Espaço` para disparar.
- **Celular (candidata 0.17.3):** joystick para movimentar; arraste o dedo na arena para orientar a nave quando não houver inimigos; ao soltar, ela retorna suavemente à frente. Com inimigos ativos, a mira prioriza o mais próximo; o disparo depende do botão DISPARAR.
- **PC (base 0.17.0):** mouse para mirar; `W/S` avançam e recuam em relação à orientação da nave; `A/D` fazem strafe; botão direito ou `Espaço` para disparar. Ainda sem validação manual nesta rodada.
- `P`: pausar ou retomar (teclado). A v0.17.3 aguarda teste manual no celular.

## Mecânicas atuais

 > **Validação:** a v0.11.0 passou no teste manual informado; a v0.11.1 ajustou o volume do áudio e a v0.12.0 adicionou as escolhas de melhoria. A v0.13.0 passou no teste manual informado pelo usuário nos sete itens verificados. A v0.14.0 foi validada; a v0.15.0 foi aprovada no teste manual em computador, com regressão mobile pendente. A v0.15.1 adiciona o disparo pelo botão direito e foi aprovada nos testes manuais em computador e celular, conforme informado pelo usuário, sem erros reportados. Os URLs do CSS, do ponto de entrada e de cada módulo incluem o identificador da versão para evitar recursos antigos em cache.

- Movimento da nave e disparo de projéteis.
- Inimigos perseguidores avançam diretamente contra a nave; colisões causam dano à integridade.
- A partir da onda 2, interceptadores ciano, rápidos e frágeis pressionam a nave com movimento agressivo.
- A partir da onda 2, alguns inimigos sentinelas tentam manter distância e disparam projéteis direcionados à posição da nave no momento do disparo.
- Projéteis dos sentinelas causam 10 pontos de dano em impacto direto e respeitam a invulnerabilidade temporária.
- A partir da onda 2, perseguidores vermelhos também podem disparar projéteis mais lentos, causando de 3 a 5 pontos de dano conforme o tamanho do inimigo; o disparo exige um pouco mais de distância e tem intervalo moderado.
- A cada cinco ondas, uma onda especial apresenta um chefe com mais integridade, movimento lateral e disparos direcionados.
- Inimigos não causam dano automático ao ultrapassar a borda da arena.
- Proteção inicial de 3 segundos ao surgir e invulnerabilidade temporária com efeito visual de piscar após receber dano.
- XP, níveis e pontuação.
- A progressão v0.16.0 apresenta três cartas por seleção e permite escolher apenas uma. Melhorias de atributos usam percentuais; cartas de atributos aparecem em níveis ímpares a partir do nível 3, e cartas especiais em marcos a cada cinco níveis. Os valores e a frequência ainda precisam de balanceamento. Habilidades iniciais incluem tiro múltiplo, laser perfurante, escudo regenerativo e reparo de emergência. Na v0.16.1, o escudo recebeu barreira, integridade própria, onda de energia e recarga automática. Na v0.16.2, os efeitos visuais foram simplificados para evitar desfoque de sombra por quadro; a fluidez ainda precisa de novo teste manual.
- Música ambiente espacial sintetizada e efeitos distintos para disparos do jogador, tiros inimigos e dano, gerados pela Web Audio API sem arquivos externos. O volume geral é ajustável nas configurações, com ganho reforçado para música e dano.
- Missões rotativas: eliminar inimigos, sobreviver por tempo determinado e alcançar ondas específicas, com dificuldades fácil, média e difícil.
- Recompensas de missão em XP e pontuação; a conclusão avança para o próximo objetivo.
- Títulos de piloto desbloqueáveis por total de missões concluídas, armazenados localmente no navegador.
- Conquistas persistentes por eliminações, chefes derrotados, missões concluídas, pontuação e ondas alcançadas, consultáveis pelo menu principal.
- Recordes pessoais de pontuação e maior onda, armazenados no navegador.
- HUD compacta dentro da arena com integridade, XP, nível, onda e pontuação sempre visíveis.
- Feedback de dano com faíscas vermelhas de baixo custo, brilho de borda discreto e animações reiniciadas sem recálculo síncrono de layout.
- Barras compactas de vida sobre os inimigos; perseguidores resistem a dois disparos e sentinelas a cinco.
- Modo de tela cheia com tentativa opcional de bloquear a orientação em paisagem.
- Ondas de inimigos com intervalos e dificuldade progressiva.
- Joystick virtual analógico para movimento com intensidade variável e botão de disparo separado em telas móveis.

## Desempenho e controles mobile

- Atualização dos indicadores HTML limitada a 10 vezes por segundo, com escrita no DOM somente quando o valor muda.
- Fundo e grade do Canvas desenhados em uma camada em cache, em vez de reconstruídos a cada quadro.
- Densidade de pixels limitada a 1,5 em dispositivos com ponteiro de toque para reduzir o custo de renderização em celulares.
- Efeitos de brilho reduzidos, desfoque de camadas da HUD desativado em dispositivos de toque e animação da chama da nave sem números aleatórios por quadro.
- Os controles de toque receberam um novo aumento de área de acionamento, com ajuste específico para telas estreitas e orientação horizontal.
- Em telas móveis estreitas, a arena usa proporção `9:20` para oferecer mais espaço vertical de combate sem alterar a escala lógica do jogo.
- O fundo em cache, a densidade de pixels limitada e os efeitos reduzidos continuam sendo medidas de otimização; o desempenho deve ser validado em dispositivos reais.

## Organização

- `src/core/`: ciclo principal, estado do jogo e gerenciador de ondas.
- `src/player/`: nave do jogador.
- `src/enemies/`: lógica de inimigos.
- `src/combat/`: projéteis do jogador, projéteis inimigos e colisões.
- `src/audio/`: música e efeitos sonoros sintetizados.
- `src/progression/`: experiência e evolução.
- `src/missions/`: objetivos, dificuldade, progresso e recompensas.
- `src/ui/`: HUD e interface.
- `docs/`: documentação técnica.

## Princípios de desenvolvimento

1. Implementar e validar uma mudança lógica por vez.
2. Usar commits pequenos, descritivos e consistentes.
3. Testar o carregamento e o jogo após mudanças estruturais.
4. Manter `main` como versão oficial.
5. Nunca incluir tokens, senhas ou credenciais no repositório.

## Histórico de versões

O histórico para jogadores fica disponível no menu principal. O registro técnico completo está em [`CHANGELOG.md`](./CHANGELOG.md), com as versões mais recentes primeiro. A v0.16.0 passou nos testes funcionais mobile informados pelo usuário. A v0.16.2 passou nos seis testes manuais de desempenho e regressão no celular informados pelo usuário. A v0.17.0 foi incorporada a `main` como candidata para validação manual; ainda não foi aprovada pelo usuário.

## GitHub Pages

O workflow em `.github/workflows/deploy.yml` publica o conteúdo do repositório quando há push em `main`. Em **Settings → Pages**, selecione **GitHub Actions** como fonte de build, se ainda não estiver selecionada.

## Histórico completo de versões

Consulte o [CHANGELOG.md](./CHANGELOG.md) para o histórico documentado desde os marcos v0.0.0 e v0.1.0. Quando não há registro verificável, isso é indicado explicitamente.
