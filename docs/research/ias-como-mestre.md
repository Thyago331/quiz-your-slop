# O que cada IA popular oferece para atuar como Mestre

Pesquisa do ticket #2 (parte do mapa #1). Fontes consultadas em **24/10/2026**, na documentação oficial, nos repositórios oficiais e nas notas de versão. Vocabulário conforme `CONTEXT.md`.

## Pergunta

O **Jogo** nunca vê o código do Jogador. Quem lê o repositório é o **Mestre**, a IA que o Jogador já usa. Esse Mestre monta o mapa, gera os **Desafios** com gabarito e corrige as respostas. Para o Jogo conduzir uma sessão sem ver código, ele precisa de um canal com o Mestre. Este documento levanta quais canais cada ferramenta oferece:

- cliente MCP;
- modo headless/CLI;
- extensões;
- instruções e skills customizadas;
- saída estruturada;
- leitura de repositório local ou remoto;
- UI dentro do chat (MCP Apps).

Versões mais recentes observadas (releases no GitHub em 24/10/2026):

| Ferramenta | Versão |
| - | - |
| Claude Code | v2.1.310 |
| Codex CLI | rust-v0.164.0 |
| Gemini CLI | v0.65.0 |
| Copilot CLI | v1.0.103 |

## Matriz IA × mecanismo

Legenda: ✅ suportado e documentado · ⚠️ parcial, experimental ou com ressalva · ❌ não suportado · ❓ não confirmado nas fontes primárias

| Mecanismo | Claude Code | Cursor (IDE + CLI `agent`) | Copilot (VS Code agent mode) | Copilot CLI | Codex CLI | Gemini CLI | ChatGPT (web) | Claude.ai (web/Desktop) |
|---|---|---|---|---|---|---|---|---|
| MCP via stdio (servidor local) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (só remoto) | ⚠️ só no Desktop (local/MCPB); web ❌ |
| MCP via HTTP (Streamable) | ✅ (+SSE legado, WS) | ✅ (+SSE) | ✅ (+SSE) | ✅ (+SSE) | ✅ | ✅ (+SSE) | ✅ (precisa de HTTPS público ou Secure MCP Tunnel) | ✅ (precisa ser alcançável pela internet) |
| MCP tools | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MCP prompts (viram comando `/`) | ✅ `/server:prompt` | ✅ | ✅ `/<server>.<prompt>` | ❓ | ❓ | ✅ | ❓ | ✅ (prompts são suportados) |
| MCP resources | ✅ (`@server:uri`) | ✅ | ✅ | ❓ | ⚠️ (há menções no changelog) | ✅ (`@`) | ❓ | ✅ |
| Elicitation (o servidor pede input ao Jogador) | ✅ form + URL (só interativo) | ✅ | ✅ (desde 1.102, URL mode 1.107) | ❓ | ✅ (form/URL via app-server) | ❓ (não achei no cliente MCP) | ❓ | ❓ |
| MCP Apps (UI `ui://` no chat) | ❌ no terminal (UI resources ficam ocultos) | ✅ | ⚠️ experimental (`chat.mcp.apps.enabled`) | ❓ | ❓ | ❓ | ✅ | ✅ (web e Desktop) |
| Headless / não interativo | ✅ `claude -p` | ✅ `agent -p` | ⚠️ não é CLI (ver Copilot CLI) | ✅ `copilot -p` | ✅ `codex exec` | ✅ `gemini -p` | ❌ | ❌ |
| Saída JSON / stream | ✅ `json`, `stream-json` | ✅ `json`, `stream-json` | — | ✅ `--output-format json` (JSONL) | ✅ `--json` (JSONL) | ✅ `json`, `stream-json` | ❌ | ❌ |
| Saída validada por JSON Schema | ✅ `--json-schema` | ❌ (não documentado) | — | ❌ (não documentado) | ✅ `--output-schema` | ❌ (não documentado) | ❌ | ❌ |
| SDK / protocolo programático | ✅ Agent SDK (TS/Python) | ⚠️ CLI e cloud agents | — | ✅ ACP (`--acp`, preview) e Copilot SDK | ✅ Codex SDK (TS/Python) e app-server (experimental) | ✅ ACP (`--acp`) | ❌ | ❌ |
| Instruções de projeto | ✅ `CLAUDE.md` | ✅ `.cursor/rules`, `AGENTS.md` | ✅ `copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md` | ✅ (lê `.github/…`) | ✅ `AGENTS.md` | ✅ `GEMINI.md` | ⚠️ instruções da conta e projetos | ⚠️ instruções de projeto |
| Skills (`SKILL.md`) | ✅ | ✅ (2.4+) | ✅ | ✅ | ✅ | ✅ | ⚠️ via plugins e "skills over MCP" (parcial) | ✅ (via plugins/skills) |
| Comandos `/` customizados | ✅ (skills/commands) | ✅ (`commands/`) | ✅ prompt files `*.prompt.md` | ✅ | ✅ (skills via `$`/`/skills`) | ✅ (custom commands) | ❌ | ❌ |
| Plugin / extensão empacotável | ✅ plugins + marketplace | ✅ plugins + marketplace | ✅ agent plugins | ✅ `copilot plugin install` | ✅ `codex plugin` | ✅ extensions + galeria | ✅ plugins (MCP + skills + UI) | ✅ plugins / connectors |
| Lê o repositório local | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (só GitHub via conector, ou upload) | ❌ web (GitHub sync ou upload); ✅ Desktop com MCP local |

## Notas por ferramenta

### Claude Code (Anthropic)

- **Headless:** o comando é `claude -p`.
  - `--output-format text|json|stream-json`.
  - `--json-schema` devolve o resultado validado no campo `structured_output`. Esse campo pode faltar, por exemplo quando o modelo recusa, então o Jogo precisa checar se ele existe.
  - `--continue` e `--resume <session_id>` permitem conduzir uma conversa em vários turnos.
  - `--mcp-config` e `--append-system-prompt` injetam configuração e instruções na execução.
  - `--bare` é recomendado para scripts e deve virar o padrão do `-p`.
  - A partir da v2.1.302, `-p` começa em modo Manual: chamadas que pedem aprovação são negadas se nada as aprovar.
  - Fonte: [Run Claude Code programmatically](https://code.claude.com/docs/en/headless).
- **Agent SDK (TS/Python):** tem as mesmas capacidades, com saída estruturada e callbacks de aprovação. Fonte: [Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview).
- **MCP:**
  - Transportes: stdio, HTTP (recomendado), SSE (obsoleto) e WebSocket.
  - Prompts viram comandos `/servidor:prompt (MCP)`. Resources são referenciados com `@server:protocol://path`.
  - Elicitation tem modo formulário e modo URL, mas é **servida só em sessões interativas**. No `-p`, um pedido de input sem hook `Elicitation` é cancelado.
  - Recursos MCP Apps (`ui://`, `text/html;profile=mcp-app`) são tratados como "páginas para um host renderizar" e ficam ocultos no terminal.
  - Fonte: [Claude Code MCP](https://code.claude.com/docs/en/mcp).
- **Plugins:** empacotam skills, agents, hooks e servidores MCP, e são distribuídos por marketplace (`.claude-plugin/marketplace.json`). O mesmo formato instala em claude.ai e Cowork. Fonte: [Plugins](https://code.claude.com/docs/en/plugins).
- **Relevância para o Jogo:** é o caso mais completo. Um plugin pode trazer a skill "seja o Mestre" e o servidor MCP do Jogo. O `-p` com `--json-schema` permite que o Jogo chame o Mestre como subprocesso e receba JSON validado.

### Cursor

- **MCP:**
  - Transportes: stdio, SSE e Streamable HTTP.
  - Recursos documentados como suportados: tools, prompts, resources, roots, elicitation e **MCP Apps**. Se o host não renderiza a UI, a mesma tool funciona pela resposta MCP normal.
  - Configuração em `.cursor/mcp.json` (projeto) ou `~/.cursor/mcp.json` (global).
  - Por padrão, o Cursor pede aprovação antes de usar uma tool MCP.
  - Fonte: [Cursor MCP](https://cursor.com/docs/context/mcp).
- **CLI (`agent`):**
  - `-p/--print` com `--output-format text|json|stream-json`.
  - Opções úteis: `--force`, `--approve-mcps`, `--trust`, `--workspace`, `--plugin-dir`, `--resume`.
  - **Não há flag de JSON Schema documentada.**
  - O CLI usa o mesmo `mcp.json` do editor (`agent mcp list`).
  - Autenticação por `CURSOR_API_KEY`.
  - Fontes: [Headless](https://cursor.com/docs/cli/headless), [Parâmetros](https://cursor.com/docs/cli/reference/parameters), [CLI MCP](https://cursor.com/docs/cli/mcp).
- **Customização:**
  - Rules em `.cursor/rules` (`.mdc`), `AGENTS.md`, User Rules e Team Rules.
  - Skills (`SKILL.md`, a partir da 2.4) e comandos `/` em `commands/`.
  - Plugins em dois formatos (Agent Plugins `plugin.json` e `.cursor-plugin/plugin.json`), com marketplace.
  - Fontes: [Rules](https://cursor.com/docs/context/rules), [Skills](https://cursor.com/docs/skills), [Plugins](https://cursor.com/docs/plugins), [Changelog 2.4](https://cursor.com/changelog/2-4).

### GitHub Copilot: VS Code agent mode

- **MCP:**
  - Transportes: stdio e HTTP/SSE. Configuração em `.vscode/mcp.json` ou no perfil.
  - Prompts viram `/<server>.<prompt>`. Resources ficam em "MCP: Browse Resources".
  - Sampling é configurável (`chat.mcp.serverSampling`).
  - **MCP Apps é experimental** (`chat.mcp.apps.enabled`, "might change or be removed").
  - Fontes: [MCP servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers), [MCP configuration](https://code.visualstudio.com/docs/copilot/reference/mcp-configuration).
- **Elicitation:**
  - Chegou na 1.102 (junho/2025).
  - Valores padrão (SEP-1034) na 1.105.
  - URL mode e spec 2025-11-25 na 1.107.
  - Formulário redesenhado na 1.112.
  - Fontes: [1.102](https://code.visualstudio.com/updates/v1_102), [1.107](https://code.visualstudio.com/updates/v1_107), [1.112](https://code.visualstudio.com/updates/v1_112).
- **Customização:**
  - Instruções: `copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md` e `*.instructions.md`.
  - Prompt files em `.github/prompts/*.prompt.md`.
  - Custom agents `*.agent.md`, skills `SKILL.md`, hooks e agent plugins.
  - Fonte: [Customization overview](https://code.visualstudio.com/docs/copilot/customization/overview).
- **Programático:** não há modo headless no VS Code em si. A automação passa pelo Copilot CLI ou SDK.

### GitHub Copilot CLI

- **Headless:**
  - `copilot -p` (ou entrada via pipe), `-s/--silent` e `--output-format json`, que emite JSONL.
  - Opções úteis: `--allow-tool`, `--allow-all-tools`, `--no-ask-user`, `--share` (exporta a transcrição).
  - **Não há saída por JSON Schema documentada.**
  - Fontes: [Run CLI programmatically](https://docs.github.com/en/copilot/how-tos/copilot-cli/automate-copilot-cli/run-cli-programmatically), [Programmatic reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference).
- **MCP:**
  - Transportes: stdio, HTTP e SSE.
  - Configuração em `~/.copilot/mcp-config.json`, `.mcp.json` ou `.github/mcp.json`, mais `--additional-mcp-config` por sessão. O CLI **não lê** `.vscode/mcp.json`.
  - A documentação só cobre tools. Prompts, resources e elicitation **não foram confirmados**.
  - Fonte: [Add MCP servers](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers).
- **ACP:** `copilot --acp` (stdio ou TCP) está em public preview desde 28/01/2026. Fontes: [ACP server](https://docs.github.com/en/copilot/reference/copilot-cli-reference/acp-server), [changelog](https://github.blog/changelog/2026-01-28-acp-support-in-copilot-cli-is-now-in-public-preview/).
- **Plugins:** `copilot plugin install`, com skills em `skills/` e `mcp.json`. Fonte: [CLI plugin reference](https://docs.github.com/en/copilot/reference/cli-plugin-reference).

### OpenAI Codex CLI

- **Headless:** o comando é `codex exec`. O sandbox padrão é read-only, o que basta para o Mestre ler o repositório.
  - `--json` emite eventos JSONL (`thread.started`, `item.*`, `turn.completed`…).
  - **`--output-schema <arquivo>`** força a resposta final num JSON Schema.
  - `-o/--output-last-message` grava a última mensagem num arquivo.
  - `codex exec resume --last|<id>` continua uma sessão.
  - `--full-auto` foi removido. Usa-se `--sandbox workspace-write` ou `--approve-for-me`.
  - Fonte: [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode). As docs de Codex migraram de developers.openai.com para learn.chatgpt.com.
- **MCP (cliente):**
  - Transportes: stdio e Streamable HTTP, configurados em `~/.codex/config.toml` ou `.codex/config.toml`.
  - Suporta OAuth (CIMD/DCR) e lê as `instructions` do servidor.
  - Elicitation é repassada pelo app-server (`mcpServer/elicitation/request`).
  - Prompts e resources não aparecem com clareza na página de MCP. **MCP Apps no CLI não foi confirmado.**
  - Fontes: [MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [App Server](https://learn.chatgpt.com/docs/app-server), [PR #17043 (elicitations)](https://github.com/openai/codex/pull/17043).
- **Codex como servidor MCP foi removido.** `codex mcp-server` saiu, e o substituto é o **app-server**: JSON-RPC por stdio, WebSocket ou Unix socket, com `outputSchema` por turno. O app-server está marcado como "experimental, not supported for production". Fonte: [MCP server removal](https://learn.chatgpt.com/docs/mcp-server).
- **SDK:** o Codex SDK existe em TypeScript e Python (`sdk/typescript`, `sdk/python` no [repositório](https://github.com/openai/codex/tree/main/sdk)). O SDK TS executa o CLI por baixo e aceita `outputSchema` em `thread.run`.
- **Customização:** `AGENTS.md`, skills `SKILL.md` (invocadas com `$` ou `/skills`) e plugins (`codex plugin`, `codex plugin marketplace`). Fontes: [AGENTS.md](https://developers.openai.com/codex/guides/agents-md), [Skills](https://developers.openai.com/codex/skills).

### Gemini CLI (Google)

- **Headless:**
  - Ativado por `-p/--prompt` ou quando não há TTY.
  - `-o/--output-format text|json|stream-json`. O JSON traz `response`, `stats` e `error`. O stream emite eventos `init`, `message`, `tool_use`, `tool_result` e `result`.
  - Códigos de saída: 0, 1, 42 (input) e 53 (limite de turnos).
  - Opções úteis: `--approval-mode default|auto_edit|yolo|plan`, `-r/--resume`, `--allowed-mcp-server-names`.
  - **Não há flag de JSON Schema.**
  - Fontes: [headless.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/headless.md), [cli-reference.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/cli-reference.md).
- **ACP:** `gemini --acp` expõe JSON-RPC por stdio. Fonte: [acp-mode.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/acp-mode.md).
- **MCP:**
  - Transportes: stdio, SSE e Streamable HTTP, configurados em `settings.json` (`mcpServers`).
  - Suporta tools, resources (via `@`) e prompts, que viram slash commands. O cliente implementa roots.
  - **Não encontrei suporte a elicitation** nem a MCP Apps no código do cliente MCP (`packages/core/src/tools/mcp-client.ts`). Ficam como não confirmados.
  - Fonte: [mcp-server.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md).
- **Extensões:** empacotam prompts, servidores MCP, custom commands, hooks, sub-agents e skills, com galeria pública. Também há `GEMINI.md`, custom commands e skills. Fonte: [extensions](https://github.com/google-gemini/gemini-cli/blob/main/docs/extensions/index.md).

### ChatGPT (web)

- **MCP:**
  - Só aceita **servidor remoto**: Streamable HTTP num endpoint HTTPS público (`/mcp`) ou via **Secure MCP Tunnel**, a opção para servidores em rede privada ou na máquina do dev.
  - O servidor é adicionado em chatgpt.com/plugins, em "Add custom MCP server".
  - Fontes: [Build MCP server](https://developers.openai.com/plugins/build/mcp-server), [Connect to ChatGPT](https://developers.openai.com/plugins/deploy/connect-chatgpt), [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels).
- **UI:** plugins podem trazer UI própria. A matriz oficial de extensões do MCP lista o ChatGPT com suporte a **MCP Apps** e suporte parcial a "Skills over MCP". Fonte: [Extension Support Matrix](https://modelcontextprotocol.io/extensions/client-matrix).
- **Planos: não confirmado.** O "developer mode" foi lançado em beta em outubro/2025. As fontes da OpenAI se contradizem sobre quais planos ainda precisam dele: um post de staff de outubro/2026 diz que ele não é mais necessário, e a página da Central de Ajuda retornou 403. Business e Enterprise têm controle de admin para criar servidores MCP. Fonte: [Developer mode (Help Center)](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt).
- **Repositório:** não lê disco local. O app do GitHub dá leitura sob demanda dos repositórios autorizados (read-only, sem sync). Fonte: [Connecting GitHub to ChatGPT](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt-deep-research).
- **Sem headless:** não há como o Jogo "dirigir" o ChatGPT de fora. Só o próprio ChatGPT chama as tools do Jogo.

### Claude.ai (web), Claude Desktop e mobile

- **Custom connectors:** são servidores MCP remotos, disponíveis em Free (1 conector), Pro, Max, Team e Enterprise. O servidor precisa ser **alcançável pela internet a partir dos IPs da Anthropic**. MCP local via `claude_desktop_config.json` ou MCPB existe só no Desktop. Fonte: [Custom connectors](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp).
- **Recursos MCP:**
  - Suportados: tools, prompts e resources (texto e binário) e **MCP Apps** (UI interativa na conversa).
  - Não suportados: resource subscriptions, sampling e recursos draft.
  - Limites: resultado de até cerca de 150 mil caracteres e timeout de 240 s por chamada de tool.
  - Fontes: [Build an MCP server for Claude](https://claude.com/docs/connectors/building), [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview).
- **Repositório:** a integração com o GitHub sincroniza os arquivos de um branch para o conhecimento do projeto, limitada à janela de contexto e sem histórico. Fora isso, só upload. Fonte: [Use the GitHub integration](https://support.claude.com/en/articles/10167454-use-the-github-integration).
- **Sem headless.** Claude Desktop com MCP local é o único caminho "chat" em que o servidor MCP do Jogo pode rodar na máquina do Jogador.

### Padrões transversais

- **MCP Apps** (`io.modelcontextprotocol/ui`, spec 2026-01-26) é a primeira extensão oficial do MCP.
  - Uma tool declara `_meta.ui.resourceUri` apontando para um recurso `ui://` com HTML. O host renderiza esse HTML num iframe sandboxed, que pode chamar tools do servidor via postMessage.
  - Se o host não suporta a extensão, cai para texto.
  - A matriz oficial marca suporte em Claude (web), Claude Desktop, VS Code Copilot, ChatGPT, Cursor, Goose e outros. **Claude Code, Codex CLI, Gemini CLI e Copilot CLI não constam.**
  - Fontes: [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview), [matriz (fonte)](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/extensions/client-matrix.mdx).
- **Agent Skills (`SKILL.md`)** é suportado por Claude Code, Cursor, Copilot (VS Code e CLI), Codex e Gemini CLI. É um formato quase universal para distribuir as instruções do Mestre.
- **`AGENTS.md`** é lido por Cursor, Copilot e Codex. Claude Code usa `CLAUDE.md` e Gemini usa `GEMINI.md`.
- **ACP (Agent Client Protocol)** é implementado por Gemini CLI e Copilot CLI (preview). É uma forma padronizada de um programa externo dirigir um agente como subprocesso.

## Implicações para a ponte Jogo ↔ Mestre

Esta seção lista opções viáveis e seus trade-offs. **A escolha da ponte é do ticket #6.**

### Opção A: o Jogo como servidor MCP (o Mestre chama o Jogo)

O Jogo expõe tools como `registrar_mapa`, `registrar_desafio(enunciado, gabarito)`, `proximo_desafio` e `registrar_correcao`. A IA do Jogador lê o repositório e chama essas tools. O Jogo só recebe o que o Mestre envia, o que respeita a fronteira de privacidade por construção.

- **Cobre:**
  - Com servidor MCP local (stdio), na máquina do Jogador: Claude Code, Cursor, VS Code Copilot, Copilot CLI, Codex CLI, Gemini CLI e Claude Desktop.
  - Com servidor remoto (HTTP público ou túnel): todos os anteriores, mais ChatGPT e Claude.ai web.
- **Trade-offs:**
  - Quem dirige a sessão é o modelo, não o Jogo. O ritmo depende de o modelo chamar as tools certas na ordem certa. Uma skill ou prompt MCP ajuda a guiar.
  - Na web (ChatGPT e Claude.ai), o Mestre não vê o repositório local. Só vê GitHub conectado ou upload, o que muda o que "ler o repo" significa.
  - Um servidor remoto exige que o Jogo hospede algo público com autenticação. Isso mexe na stack (fog do mapa).
  - Prompts MCP e elicitation têm suporte desigual. Elicitation não funciona no `claude -p` e não foi confirmada em Gemini CLI nem em Copilot CLI.

### Opção A+: servidor MCP com MCP Apps (UI do Jogo dentro do chat)

É a mesma ponte da opção A, mas as tools devolvem um recurso `ui://` com a interface do Jogo (palco, placar, Desafio) renderizada na conversa. A UI chama tools do servidor para registrar as respostas do Jogador.

- **Cobre:** Claude.ai e Claude Desktop, ChatGPT, Cursor e VS Code Copilot (experimental). **Não cobre** Claude Code, Codex CLI, Gemini CLI nem Copilot CLI, que caem para texto.
- **Trade-offs:**
  - Os "elementos de game show" ganham palco sem app separado.
  - A extensão é nova (spec de janeiro/2026) e o suporte varia por host.
  - O iframe é sandboxed e cada host tem sua política de CSP e permissões.

### Opção B: o Jogo chama o Mestre como subprocesso (CLI headless)

O Jogo (um app local) executa `claude -p`, `codex exec`, `gemini -p`, `agent -p` ou `copilot -p` no diretório do repositório. Envia o prompt do papel de Mestre e recebe JSON. O Jogo nunca lê os arquivos: só repassa o caminho e recebe o que o Mestre devolve.

- **Cobre:** Claude Code, Codex CLI, Gemini CLI, Cursor CLI e Copilot CLI. **Não cobre** ChatGPT, Claude.ai nem o VS Code puro.
- **Trade-offs:**
  - Aqui o **Jogo controla o ciclo da sessão**: pede o mapa, depois o Desafio, depois a correção.
  - Só Claude Code (`--json-schema`) e Codex (`--output-schema`) validam a saída contra um schema. Cursor, Gemini e Copilot dão JSON apenas como envelope, e o conteúdo precisa ser parseado e validado pelo Jogo.
  - Cada CLI tem flags, autenticação e permissões diferentes, então o Jogo precisaria de um adaptador por ferramenta.
  - Há um custo de privacidade de percepção: o Jogo executa um processo com acesso ao repositório, embora não leia o código.
  - Há variantes mais ricas, com sessão longa e streaming: Agent SDK (Claude), Codex SDK/app-server (este experimental) e ACP (Gemini CLI, Copilot CLI preview).

### Opção C: skill, plugin ou instrução distribuída ("o Mestre já sabe as regras")

O Jogo publica uma skill `SKILL.md` ou um plugin/extensão com o papel de Mestre, o formato dos Desafios e a correção. É um complemento da opção A ou da B, não uma ponte por si só: ensina o Mestre, mas não transporta dados até o Jogo.

- **Cobre:** Claude Code, Cursor, Copilot (VS Code e CLI), Codex e Gemini CLI via skills. Claude.ai e ChatGPT via plugins (no ChatGPT, skills chegam via MCP e o suporte é parcial).
- **Trade-offs:** reduz o atrito para guiar o modelo. Há um formato quase comum (`SKILL.md`), mas o empacotamento do plugin difere em cada ferramenta.

### Opção D: copiar e colar prompt e JSON (sem integração)

O Jogo mostra um prompt para o Jogador colar na IA dele. A IA devolve um bloco JSON (mapa, Desafios, gabaritos) que o Jogador cola de volta no Jogo. A correção segue o mesmo caminho, ou é feita pelo próprio Jogo comparando com o gabarito.

- **Cobre:** todas as ferramentas, inclusive web chats sem conector e IAs fora desta lista.
- **Trade-offs:**
  - Não exige nada do lado da IA. Também é o caminho mais natural para o tutorial sem IA.
  - O atrito é alto e o regime de honra é inevitável (já aceito no MVP).
  - Sem schema forçado, o JSON pode vir malformado, então o Jogo precisa validar e pedir correção.
  - Na web, o Mestre só vê o que o Jogador conectou ou subiu.

### Resumo de cobertura

| Ponte | Claude Code | Cursor | VS Code Copilot | Copilot CLI | Codex CLI | Gemini CLI | ChatGPT | Claude.ai/Desktop |
|---|---|---|---|---|---|---|---|---|
| A: MCP local (stdio) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Desktop ✅ / web ❌ |
| A: MCP remoto | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| A+: MCP Apps | ❌ | ✅ | ⚠️ | ❓ | ❓ | ❓ | ✅ | ✅ |
| B: CLI headless | ✅ (schema) | ✅ | ❌ | ✅ | ✅ (schema) | ✅ | ❌ | ❌ |
| C: skill/plugin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| D: copiar/colar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Não confirmado

Pontos que ficaram em aberto nesta pesquisa:

- Suporte a prompts, resources e elicitation MCP no Copilot CLI.
- Elicitation e MCP Apps no Gemini CLI.
- MCP Apps no Codex CLI.
- Planos exatos do ChatGPT que permitem servidor MCP customizado em outubro/2026: as fontes oficiais se contradizem.
