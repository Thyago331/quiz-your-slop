# Glossário de traduções

O `CONTEXT.md` segue em português (spec §12); a interface traduz os termos. Esta tabela fixa como
cada termo do domínio aparece em inglês e espanhol, para o site, o Jogo, o Tutorial e os Desafios
traduzidos (#30) dizerem a mesma coisa. As mensagens moram em `packages/i18n/src/mensagens/`
(interface compartilhada), `apps/site/src/textos/` (páginas do site) e
`packages/taverna/src/traducoes.ts` (mapa da Taverna).

## Termos do domínio

| pt (CONTEXT.md)        | en                    | es                       |
| ---------------------- | --------------------- | ------------------------ |
| Jogo                   | Game                  | Juego                    |
| Jogador                | Player                | Jugador                  |
| Mestre                 | Master                | Máster                   |
| Projeto                | Project               | Proyecto                 |
| Aventura               | Adventure             | Aventura                 |
| Expedição              | Expedition            | Expedición               |
| Desafio                | Challenge             | Desafío                  |
| Formato de Desafio     | Challenge format      | Formato de Desafío       |
| Múltipla escolha       | Multiple choice       | Opción múltiple          |
| Apontar no código      | Point to the code     | Señalar en el código     |
| Traçar o fluxo         | Trace the flow        | Trazar el flujo          |
| gabarito               | answer key            | solución                 |
| Evidência              | Evidence              | Evidencia                |
| Contestação            | Dispute               | Impugnación              |
| contestar              | dispute               | impugnar                 |
| Território             | Territory             | Territorio               |
| Região                 | Region                | Región                   |
| Ligação                | Link                  | Enlace                   |
| Chamada                | Call                  | Llamada                  |
| Consulta               | Query                 | Consulta                 |
| Evento                 | Event                 | Evento                   |
| Dependência (direta)   | (Direct) dependency   | Dependencia (directa)    |
| Classe                 | Class                 | Clase                    |
| Cavaleiro do Backend   | Backend Knight        | Caballero del Backend    |
| Mago do Frontend       | Frontend Mage         | Mago del Frontend        |
| Bardo Fullstack        | Fullstack Bard        | Bardo Fullstack          |
| Névoa                  | Fog                   | Niebla                   |
| Região desbloqueada    | Unlocked Region       | Región desbloqueada      |
| Região revelada        | Revealed Region       | Región revelada          |
| Região desatualizada   | Outdated Region       | Región desactualizada    |
| Progresso da Aventura  | Adventure Progress    | Progreso de la Aventura  |
| XP                     | XP                    | XP                       |
| Título                 | Title                 | Título                   |
| Guardião               | Guardian              | Guardián                 |
| Caçador de Slop        | Slop Hunter           | Cazador de Slop          |
| GOLPE CRÍTICO          | CRITICAL HIT          | GOLPE CRÍTICO            |
| VITÓRIA                | VICTORY               | VICTORIA                 |
| Tutorial               | Tutorial              | Tutorial                 |
| Taverna do Slop        | Slop Tavern           | Taberna del Slop         |

## Títulos

Os nomes dos Títulos são traduzidos só na tela. O envio de progresso (`titulo` no JSON, spec §8)
leva sempre o nome em português, que é o valor estável guardado no servidor; a tela traduz pelo
nome em português (`nomeDoTitulo` em `@quiz/i18n`).

| pt (valor do envio)  | en                 | es                   |
| -------------------- | ------------------ | -------------------- |
| Comitador Cego       | Blind Committer    | Commiteador Ciego    |
| Leitor de Diff       | Diff Reader        | Lector de Diff       |
| Arqueólogo de Código | Code Archaeologist | Arqueólogo de Código |
| Unslopper            | Unslopper          | Unslopper            |

## A Taverna do Slop

Os ids (`salao`, `cardapio`...) não mudam; só os nomes na tela.

| pt                  | en              | es                 |
| ------------------- | --------------- | ------------------ |
| Salão (Território)  | Hall            | Salón              |
| Balcão (Território) | Counter         | Barra              |
| Adega (Território)  | Cellar          | Bodega             |
| Cozinha (Território)| Kitchen         | Cocina             |
| Cardápio            | Menu            | Carta              |
| Carrinho e Checkout | Cart & Checkout | Carrito y Pago     |
| API de Pedidos      | Orders API      | API de Pedidos     |
| Cofre do Anão       | Dwarf's Vault   | Cofre del Enano    |
| Grimório            | Grimoire        | Grimorio           |
| Livro de Registros  | Ledger          | Libro de Registros |
| Fogão               | Stove           | Fogón              |

O código da Taverna (`packages/taverna/codigo/`) já é em inglês e não se traduz. Os Desafios da
Taverna existem nos três idiomas: o português em `packages/taverna/src/desafios/`, os textos em
inglês e espanhol em `desafios/en/` e `desafios/es/`, com as mesmas Evidências (o código não muda).
