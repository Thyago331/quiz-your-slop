# Quiz your slop

Um jogo de perguntas e respostas (game show/RPG) em que o jogador aprende como o próprio projeto funciona, explorando um mapa gerado a partir da estrutura do repositório.

## Language

**Jogo**:
O produto Quiz your slop: regras, progressão, pontuação e interface. Roda na máquina do Jogador e nunca envia o código dele para fora dela.
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
A fração das regiões já conhecidas (fora da Névoa) de uma Aventura que estão reveladas; pode cair quando novas regiões são descobertas ou ficam desatualizadas.
_Avoid_: Conclusão, porcentagem

**XP**:
Pontos de experiência do Jogador, acumulados em todas as Aventuras.
_Avoid_: Pontos, score, moeda

**Título**:
O nome cosmético do nível de XP do Jogador: Comitador Cego → Leitor de Diff → Arqueólogo de Código → Unslopper.
_Avoid_: Rank, patente

**Guardião**:
O adversário de uma Expedição, que representa a região sendo conquistada; cada acerto tira uma de suas 4 vidas, e derrotá-lo revela a região. Errar não custa nada ao Jogador.
_Avoid_: Chefe, boss, monstro, inimigo

**Névoa**:
O que cobre as regiões do mapa ainda não desbloqueadas; no início da Aventura, só a região de entrada está fora dela.
_Avoid_: Fog, oculto, bloqueado

**Classe**:
O papel que o Jogador escolhe para uma Aventura — Backend, Frontend ou Fullstack; define a região de entrada e o foco dos Desafios.
_Avoid_: Perfil, papel, role

**Tutorial**:
A Aventura fixa sobre a **Taverna do Slop** — um Projeto feito sob medida para o jogo, jogável no site sem Mestre, com Desafios escritos à mão.
_Avoid_: Demo, onboarding, projeto de exemplo

**Projeto**:
O conjunto de um ou mais repositórios do Jogador sobre o qual uma Aventura acontece, tratado como um sistema único.
_Avoid_: Repo, codebase, workspace

**Território**:
Agrupamento visual das Regiões de uma mesma aplicação ou serviço do Projeto (um repositório, ou uma app dentro de um monorepo). Não tem estado nem Expedição própria.
_Avoid_: Reino, continente, app, serviço

**Região**:
Uma responsabilidade funcional do projeto do Jogador (ex.: Autenticação, API de pedidos, Esquema do banco), definida pelo Mestre e associada aos arquivos que a compõem, independentemente das pastas.
_Avoid_: Módulo, pasta, pacote, área, zona

**Ligação**:
Uma comunicação concreta entre duas Regiões — Chamada (HTTP/gRPC/GraphQL), Consulta (banco), Evento (fila/tópico) ou Dependência direta (import). Duas Regiões são vizinhas se e somente se existe uma Ligação entre elas.
_Avoid_: Conexão, aresta, estrada, relação

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

**Evidência**:
O `caminho:linha` e o trecho de código que comprovam o gabarito de um Desafio; obrigatória em todo Desafio.
_Avoid_: Fonte, referência, prova

**Contestação**:
O pedido do Jogador para o Mestre reavaliar um gabarito que ele acredita estar errado. Se o Mestre reconhece o erro, o Desafio é anulado e o Jogador ganha XP bônus de Caçador de Slop.
_Avoid_: Reclamação, report, recurso

**Formato de Desafio**:
A forma de resposta de um Desafio. No MVP: **Múltipla escolha**, **Apontar no código** (escolher o arquivo/função certos) e **Traçar o fluxo** (ordenar os passos de um caminho pelo sistema). Todos têm gabarito objetivo.
_Avoid_: Tipo de pergunta, modo
