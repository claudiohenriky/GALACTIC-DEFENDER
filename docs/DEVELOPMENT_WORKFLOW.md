# Fluxo de desenvolvimento

Este documento define um processo de trabalho para manter alterações rastreáveis e evitar mudanças acidentais na versão oficial.

## Princípios

- `main` representa a linha oficial do repositório.
- Trabalho em andamento deve permanecer em branches próprias.
- Uma branch de trabalho não deve ser integrada sem revisão do diff, verificações automatizadas e aprovação explícita.
- Cada commit deve representar uma alteração coerente e ter uma mensagem curta no formato `tipo: descrição`.
- Não registrar credenciais, tokens, dados pessoais ou arquivos gerados desnecessários.

## Ciclo de alteração

1. **Identificar o escopo:** descrever o problema e delimitar os arquivos que podem mudar.
2. **Inspecionar antes de editar:** conferir o estado da branch, o diff existente e os testes relacionados.
3. **Alterar incrementalmente:** evitar misturar refatoração, correção e mudança visual em um único commit.
4. **Verificar:** executar as verificações estáticas e os testes automatizados pertinentes ao escopo.
5. **Revisar o diff:** procurar arquivos inesperados, alterações fora do escopo, espaços em branco problemáticos e referências quebradas.
6. **Registrar:** criar um commit descritivo e atualizar o resumo da branch ou do pull request.
7. **Decidir:** manter a candidata separada até que a revisão e as aprovações necessárias estejam concluídas.

## Verificações automatizadas existentes

O workflow `.github/workflows/validate.yml` executa:

- verificação sintática dos arquivos JavaScript;
- testes automatizados encontrados em `tests/*.mjs`;
- verificação de resolução dos imports relativos;
- verificação de whitespace no patch.

O resultado verde confirma apenas que essas verificações automatizadas passaram. Não comprova, por si só, compatibilidade visual, acessibilidade, comportamento em navegadores ou desempenho em dispositivos reais.

## Registro de validação

Para cada rodada, registrar:

| Campo | O que registrar |
| --- | --- |
| Branch e commit | Nome da branch e SHA exato avaliado |
| Ambiente | Sistema, navegador e versão, quando aplicável |
| Verificações | Comandos executados e resultado |
| Evidências | Logs ou capturas pertinentes, sem dados sensíveis |
| Pendências | Itens não verificados ou resultados inconclusivos |
| Decisão | Aprovado, reprovado ou aguardando validação |

Nunca marcar uma verificação como concluída sem evidência correspondente. Se um teste não foi executado, registrar como pendente.

## Proteção da versão oficial

- Não fazer commits diretamente em `main` durante o desenvolvimento de uma candidata.
- Não mesclar pull requests automaticamente.
- Antes de qualquer integração, confirmar que o destino e o conteúdo do pull request estão corretos.
- Manter explícitas as diferenças entre validação estática, teste automatizado e validação manual.
