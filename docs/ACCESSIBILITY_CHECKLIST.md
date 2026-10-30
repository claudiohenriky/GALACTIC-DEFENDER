# Checklist de acessibilidade da interface

Este checklist cobre elementos gerais da interface web: navegação, menus, configurações, mensagens, legibilidade e adaptação de tela. Ele não substitui avaliação com pessoas usuárias nem auditoria automatizada especializada.

## Semântica e navegação

- [ ] Usar elementos HTML semânticos de acordo com sua finalidade.
- [ ] Garantir que controles interativos sejam acessíveis por teclado.
- [ ] Manter uma ordem de foco lógica e previsível.
- [ ] Exibir indicador de foco visível.
- [ ] Associar rótulos explícitos aos campos e controles.
- [ ] Dar nomes acessíveis a botões que usam apenas ícones.
- [ ] Evitar elementos interativos aninhados.

## Leitura e apresentação

- [ ] Manter contraste suficiente entre texto, ícones e plano de fundo.
- [ ] Não comunicar estados somente por cor.
- [ ] Permitir ampliação do texto sem perda de conteúdo ou funcionalidade.
- [ ] Evitar texto pequeno em informações essenciais.
- [ ] Usar mensagens curtas, claras e consistentes.
- [ ] Respeitar a preferência do sistema por movimento reduzido quando houver animações decorativas.

## Layout responsivo

- [ ] Conferir menus e configurações em larguras estreitas e amplas.
- [ ] Evitar rolagem horizontal desnecessária.
- [ ] Garantir que diálogos e painéis caibam na área visível.
- [ ] Manter alvos de toque com tamanho e espaçamento adequados.
- [ ] Verificar que o conteúdo continue utilizável em orientação retrato e paisagem.

## Estados e feedback

- [ ] Informar claramente quando uma configuração foi alterada.
- [ ] Não depender apenas de animações para comunicar uma mudança.
- [ ] Anunciar mensagens importantes de estado de forma compatível com tecnologias assistivas.
- [ ] Garantir que erros expliquem o problema e indiquem como corrigi-lo.
- [ ] Evitar mover o foco inesperadamente após uma ação.

## Registro de revisão

Para cada revisão, registrar:

- Data e identificação do commit.
- Navegador e dispositivo utilizados.
- Itens verificados e resultado observado.
- Problemas encontrados, com passos para reproduzi-los.
- Itens que não puderam ser avaliados.

Não marcar itens como aprovados sem verificação. Uma revisão documental é apenas preparação; a confirmação depende de testes na interface real.
