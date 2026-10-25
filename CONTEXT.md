# Quiz your slop

Um jogo de perguntas e respostas (game show/RPG) em que o jogador aprende como o próprio projeto funciona, explorando um mapa gerado a partir da estrutura do repositório.

## Language

**Jogo**:
O produto Quiz your slop: regras, progressão, pontuação e interface. Nunca vê o código do jogador, só o que o Mestre entrega.
_Avoid_: App, plataforma, servidor

**Jogador**:
A pessoa que joga e responde aos desafios com o próprio entendimento do código.
_Avoid_: Usuário, dev

**Mestre**:
A IA escolhida pelo Jogador, que lê o repositório, monta o mapa, gera os desafios e corrige as respostas.
_Avoid_: Agente, bot, assistente, IA do jogo

**Aventura**:
A campanha de longa duração do Jogador sobre um projeto; guarda o mapa, as regiões reveladas e o XP daquele projeto.
_Avoid_: Partida, jogo, run

**Expedição**:
Uma sessão curta dentro de uma Aventura, focada numa região do mapa, composta por uma sequência de Desafios e encerrada com um resultado.
_Avoid_: Sessão, rodada, missão, nível

**Progresso da Aventura**:
A fração das regiões do mapa de uma Aventura que já foram reveladas.
_Avoid_: Conclusão, porcentagem

**XP**:
Pontos de experiência do Jogador, acumulados em todas as Aventuras.
_Avoid_: Pontos, score, moeda

**Título**:
O nome cosmético do nível de XP do Jogador: Comitador Cego → Leitor de Diff → Arqueólogo de Código → Unslopper.
_Avoid_: Rank, patente, classe

**Névoa**:
O que cobre as regiões do mapa ainda não desbloqueadas; no início da Aventura, só a região de entrada está fora dela.
_Avoid_: Fog, oculto, bloqueado

**Região desbloqueada**:
Uma região fora da Névoa, visível e disponível para Expedições, mas ainda não conquistada.
_Avoid_: Aberta, disponível

**Região revelada**:
Uma região conquistada por uma Expedição bem-sucedida; revelá-la desbloqueia as regiões vizinhas.
_Avoid_: Completa, concluída, dominada

**Região desatualizada**:
Uma região que estava revelada mas cujo código mudou o bastante desde então; continua visível e precisa de uma nova Expedição, focada no que mudou, para voltar a ser revelada.
_Avoid_: Expirada, quebrada, stale

**Desafio**:
Uma pergunta sobre o código do projeto do Jogador, gerada pelo Mestre junto com o seu gabarito. (No tutorial, os Desafios já vêm prontos, sem Mestre.)
_Avoid_: Pergunta, quiz, questão
