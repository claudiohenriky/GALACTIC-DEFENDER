# Histórico de versões — GALACTIC-DEFENDER

## [0.16.1] — Escudo regenerativo (em validação)

### Alterado
- Substitui o bloqueio por cargas consumíveis por uma barreira de energia visível ao redor da nave.
- Adiciona barra de integridade do escudo e recarga automática após a quebra.
- Ao ser destruída, a barreira libera uma onda de energia que causa dano aos inimigos próximos.
- Melhorias adicionais de escudo aumentam sua integridade máxima até o limite definido.

### Validação
- Aguardando teste manual no GitHub Pages, especialmente integridade, explosão, recarga e regressão mobile.

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
- A v0.14.0 foi validada pelo usuário. A v0.15.0 foi aprovada no teste manual em computador; o teste de regressão no celular continua pendente. A v0.15.1 foi aprovada nos testes manuais em computador e celular, conforme informado pelo usuário, sem erros reportados.
