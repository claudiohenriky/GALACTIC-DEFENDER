# GALACTIC-DEFENDER

Jogo de ação espacial para navegador, desenvolvido do zero com HTML, CSS e JavaScript puro.

## Estado do projeto

**Versão em desenvolvimento:** `0.13.0` — chefes em ondas especiais, histórico de versões e ajuste de combate dos perseguidores.

**Fase:** primeira implementação do sistema de missões e progressão; validação manual no GitHub Pages pendente.

- Plataforma: navegadores modernos em computador e celular.
- Controles: teclado para movimentação, mouse para mirar e joystick virtual analógico e botão de disparo em dispositivos compatíveis. A mira por mouse foi integrada em `main` e aguarda validação manual no computador.
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

- `WASD` ou setas: mover a nave.
- `Mouse`: mirar; `Espaço`: disparar na direção da mira.
- `Espaço`: disparar.
- `P`: pausar ou retomar (teclado).
- Celular: arraste o joystick virtual para movimentar a nave em qualquer direção e use **DISPARAR** para atirar.

## Mecânicas atuais

 > **Validação:** a v0.11.0 passou no teste manual informado; a v0.13.0 adiciona controle de volume e reforço de música/dano. Validar a publicação após o merge. Os URLs do CSS, do ponto de entrada e de cada módulo incluem o identificador da versão para evitar recursos antigos em cache.

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
- Ao subir de nível, o jogo pausa para uma escolha entre dano da arma, velocidade da nave ou escudo consumível com reparo parcial. Dano e velocidade têm limites; o escudo bloqueia um impacto e pode acumular até três cargas.
- Música ambiente espacial sintetizada e efeitos distintos para disparos do jogador, tiros inimigos e dano, gerados pela Web Audio API sem arquivos externos. O volume geral é ajustável nas configurações, com ganho reforçado para música e dano.
- Missões rotativas: eliminar inimigos, sobreviver por tempo determinado e alcançar ondas específicas, com dificuldades fácil, média e difícil.
- Recompensas de missão em XP e pontuação; a conclusão avança para o próximo objetivo.
- Títulos de piloto desbloqueáveis por total de missões concluídas, armazenados localmente no navegador.
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

O histórico para jogadores fica disponível no menu principal. O registro técnico completo está em [`CHANGELOG.md`](./CHANGELOG.md), com as versões mais recentes primeiro. A v0.13.0 permanece em desenvolvimento até passar pela revisão e pelos testes de jogo.

## GitHub Pages

O workflow em `.github/workflows/deploy.yml` publica o conteúdo do repositório quando há push em `main`. Em **Settings → Pages**, selecione **GitHub Actions** como fonte de build, se ainda não estiver selecionada.
