# Checklist de revisão de alterações

Este documento padroniza a revisão de mudanças antes de uma candidata ser considerada pronta para avaliação. Ele complementa o fluxo de desenvolvimento e o checklist de acessibilidade; não substitui testes, revisão por outra pessoa ou validação no ambiente real.

## 1. Escopo e rastreabilidade

- [ ] O objetivo da alteração está descrito de forma específica.
- [ ] Os arquivos modificados pertencem ao escopo aprovado.
- [ ] Não existem alterações incidentais ou arquivos gerados sem necessidade.
- [ ] A branch de trabalho e o commit-base foram identificados.
- [ ] A alteração pode ser revisada como uma unidade coerente.
- [ ] Dependências, limitações e riscos conhecidos foram registrados.

## 2. Revisão técnica

- [ ] Nomes, estruturas e responsabilidades permanecem consistentes com o projeto.
- [ ] Não foram introduzidas duplicações evitáveis.
- [ ] Tratamento de erros e estados inesperados foi considerado.
- [ ] Entradas externas e dados persistidos são tratados de forma previsível.
- [ ] Não foram adicionados segredos, tokens ou dados pessoais.
- [ ] Comentários e documentação continuam correspondendo ao comportamento real.
- [ ] O diff completo foi revisado, inclusive arquivos de configuração.

## 3. Verificações automatizadas

- [ ] Verificações estáticas pertinentes foram executadas.
- [ ] Testes automatizados pertinentes foram executados.
- [ ] Verificações de imports e dependências foram executadas, quando aplicável.
- [ ] O resultado do CI corresponde ao commit exato que está sendo avaliado.
- [ ] Falhas foram corrigidas ou registradas explicitamente como pendências.
- [ ] Nenhum resultado foi descrito como aprovado sem evidência.

**Importante:** CI verde confirma somente os checks que realmente foram executados. Não comprova experiência visual, acessibilidade completa, compatibilidade em todos os dispositivos ou desempenho real.

## 4. Validação manual e experiência de uso

- [ ] A interface foi verificada nos tamanhos de tela relevantes.
- [ ] Navegação por teclado, foco e rótulos foram conferidos.
- [ ] Estados de carregamento, sucesso e erro foram observados.
- [ ] Não há bloqueios evidentes de navegação ou conteúdo.
- [ ] Compatibilidade com navegadores e dispositivos foi avaliada conforme o escopo.
- [ ] Problemas observados possuem passos de reprodução.
- [ ] Itens não testados permanecem identificados como pendentes.

## 5. Documentação e histórico

- [ ] O changelog descreve somente mudanças efetivamente concluídas.
- [ ] A documentação técnica foi atualizada quando necessário.
- [ ] A versão e a identificação da candidata são consistentes entre os documentos.
- [ ] A mensagem do commit descreve a alteração real.
- [ ] O pull request explica objetivo, escopo, evidências e limitações.
- [ ] A branch oficial não recebeu alterações não autorizadas.

## 6. Decisão da revisão

Marcar somente uma opção:

- [ ] **Aprovada para a próxima etapa:** escopo revisado e evidências suficientes para avançar.
- [ ] **Aguardando validação:** faltam testes ou evidências relevantes.
- [ ] **Reprovada:** há defeitos ou riscos que exigem correção antes de avançar.

### Registro da rodada

| Campo | Registro |
| --- | --- |
| Data | |
| Branch | |
| Commit avaliado | |
| Responsável pela revisão | |
| Verificações executadas | |
| Evidências | |
| Pendências e riscos | |
| Decisão | |

## Regra de conclusão

Uma alteração só deve ser descrita como concluída dentro do nível de validação realmente alcançado. Documentação revisada, CI aprovado e teste manual são evidências diferentes e não devem ser tratados como equivalentes.
