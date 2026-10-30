# Modelo de registro de validação

Use uma cópia deste modelo para registrar cada rodada de verificação. Um registro deve apontar para um commit imutável e distinguir claramente o que foi executado do que continua pendente.

## Identificação

| Campo | Valor |
| --- | --- |
| Data e horário | |
| Branch | |
| Commit (SHA completo) | |
| Responsável | |
| Objetivo da rodada | |
| Ambiente / navegador / dispositivo | |

## Escopo avaliado

Descreva somente as áreas incluídas nesta rodada.

- Incluído:
- Fora do escopo:
- Riscos conhecidos:

## Verificações executadas

| Verificação | Comando ou procedimento | Resultado | Evidência |
| --- | --- | --- | --- |
| Revisão do diff | | Pendente | |
| Análise estática | | Pendente | |
| Testes automatizados | | Pendente | |
| Compatibilidade | | Pendente | |
| Acessibilidade | | Pendente | |
| Verificação manual | | Pendente | |

Use resultados objetivos: **Aprovado**, **Reprovado**, **Não executado** ou **Inconclusivo**. Não transforme uma etapa não executada em aprovação.

## Problemas e observações

Para cada problema, registrar:

1. Descrição objetiva.
2. Ambiente em que foi observado.
3. Passos para reprodução, quando aplicável.
4. Resultado esperado e resultado observado.
5. Gravidade e impacto.
6. Situação: aberto, corrigido ou aguardando nova verificação.

## Pendências

- [ ] Item pendente 1:
- [ ] Item pendente 2:
- [ ] Item pendente 3:

## Conclusão

- [ ] **Aprovado no escopo avaliado**
- [ ] **Aguardando evidências ou testes**
- [ ] **Reprovado; requer correções**

**Limites da conclusão:** registrar o que esta rodada não avaliou. A aprovação vale somente para o commit, ambiente, escopo e verificações documentados acima.

## Histórico de revalidação

| Data | Novo commit | Motivo da revalidação | Resultado |
| --- | --- | --- | --- |
| | | | |
