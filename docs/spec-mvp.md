# Spec do MVP — Quiz your slop

> *learn, gamification, unslop your code*

Consolida as decisões do mapa [Mapa: spec do MVP do Quiz your slop](https://github.com/Thyago331/quiz-your-slop/issues/1). Cada seção aponta o ticket que tem o detalhe; esta spec não traz decisões novas. Vocabulário em [`CONTEXT.md`](../CONTEXT.md) — os termos em **negrito** vêm de lá.

## 1. Visão

Nunca se commitou tanto código e se leu tão pouco. Quiz your slop é um game show/RPG em que o **Jogador** descobre como o próprio projeto funciona: a IA dele vira o **Mestre**, o mapa nasce da estrutura do repositório, e cada região só se revela quando ele entende como ela funciona.

Problemas que o jogo ataca:
- devs não conhecem o próprio código;
- não sabem como as coisas funcionam;
- não sabem como as partes se comunicam (front ↔ back ↔ banco).

### Princípios inegociáveis

1. **O código do Jogador nunca sai da máquina dele.** O Jogo roda localmente; o servidor só recebe progresso sem conteúdo.
2. **A IA é a do Jogador.** O Jogo não fornece IA; usa o Claude Code ou o Codex que o Jogador já tem, em modo somente leitura.
3. **Aprender é a recompensa.** Progressão não libera poder; errar não pune.
4. **Desconfiar da IA é mecânica.** Todo gabarito traz Evidência e pode ser contestado.

## 2. Escopo do MVP

**Entra**:
- Tutorial no site com a Taverna do Slop (sem IA).
- Jogo desktop para Windows e Linux jogando sobre o Projeto do Jogador com Claude Code ou Codex.
- Conta com login GitHub; servidor de progresso.
- Site público com SEO/GEO.
- Idiomas pt, en e es.

**Fora** (do mapa, seção *Out of scope*):
- Antitrapaça (regime de honra).
- Multiplayer e ranking; monetização.
- Modo "Mestre rival".
- Classes além de Backend/Frontend/Fullstack.
- Desafios de resposta livre.
- Adaptadores para Gemini CLI, Cursor CLI e Copilot CLI.
- Chats web, servidor MCP e copiar/colar como ponte.
- Sync cifrado ponta a ponta da Aventura.
- macOS e assinatura de binários pelo SO.
- Gerenciadores de pacote.

## 3. Ciclo de jogo

Detalhe: [Qual é o ciclo de uma sessão de jogo e a progressão do MVP](https://github.com/Thyago331/quiz-your-slop/issues/3).

- **Aventura** = campanha longa sobre um **Projeto**; **Expedição** = sessão curta (10–20 min) numa região.
- **Estados da região**: na **Névoa** → **Região desbloqueada** → **Região revelada** (→ **Região desatualizada**).
- **Início**:
  - Só a região de entrada está fora da Névoa.
  - Revelar uma região desbloqueia as vizinhas (vizinha = existe uma **Ligação**, nos dois sentidos).
- **Expedição**:
  - 5 **Desafios**; **4 acertos** revelam a região.
  - Sem vidas, sem punição; nova tentativa traz Desafios novos.
  - Um Desafio anulado por **Contestação** conta como acerto.
- **Feedback**:
  - Correção imediata após cada Desafio, com explicação, **Evidência** (`caminho:linha`) e **trechos de código na tela**.
  - Resumo no fim: acertos, XP, região revelada ou não, arquivos citados.
- **Progressão**:
  - **Progresso da Aventura** = fração das regiões conhecidas que estão reveladas (pode cair).
  - **XP** global do Jogador.
  - **Título** cosmético: Comitador Cego → Leitor de Diff → Arqueólogo de Código → Unslopper. Nível não libera mecânica.
- **Código que muda**: regiões reveladas cujo código mudou o bastante viram **Região desatualizada** e pedem nova Expedição sobre o que mudou (§6).

### Valores de calibragem (padrões iniciais, configuráveis)

Usados no protótipo e não discutidos como decisão; servem de ponto de partida e devem ficar em configuração:

| Valor | Padrão |
|---|---|
| XP por acerto | 20 |
| XP bônus de Caçador de Slop (Contestação vencida) | 50 |
| Limiares dos Títulos | 0 / 100 / 300 / 600 XP |
| Mudança que torna a região desatualizada | ≥ 20% das linhas (§6) |

## 4. Mapa

Detalhe: [O que é uma Região e como o mapa mostra estrutura e comunicação](https://github.com/Thyago331/quiz-your-slop/issues/4).

- **Região** = responsabilidade funcional definida pelo Mestre a partir da estrutura (não uma pasta), com a lista dos arquivos que cobre. Dimensionada para render ~5 Desafios novos por tentativa; o Mestre divide ou funde para chegar nisso.
- **Ligação**: os quatro tipos são **Chamada** (HTTP/gRPC/GraphQL), **Consulta** (banco), **Evento** (fila/tópico) e **Dependência direta** (import).
- **Projeto e Território**:
  - **Projeto** = 1+ repositórios git locais, tratado como um sistema; Ligações podem atravessar repositórios.
  - **Território** = agrupamento visual por aplicação/serviço, sem estado próprio.
- **Classe** (escolhida por Aventura): **Backend**, **Frontend** ou **Fullstack**.
  - **Região de entrada**:
    - Backend → rota/serviço principal.
    - Frontend → página inicial/login.
    - Fullstack → região com Ligação front ↔ back.
  - O Mestre sugere 1–3 candidatas e o Jogador escolhe. Se o Projeto não tem a parte da Classe, o Mestre avisa e sugere a entrada mais próxima.
- **Mapa descoberto aos poucos**:
  - Na criação, só Territórios + entrada.
  - Ao desbloquear, o Mestre detalha a região.
  - As Ligações chegam junto com a preparação da Expedição e ficam escondidas até a vitória (§7).

## 5. Desafios

Detalhe: [Quais formatos de Desafio entram no MVP](https://github.com/Thyago331/quiz-your-slop/issues/5).

- **Formatos de Desafio** (todos com gabarito objetivo, corrigidos pelo Jogo):
  - **Múltipla escolha**.
  - **Apontar no código**: escolher o arquivo/função certos; distratores escolhidos pelo Mestre.
  - **Traçar o fluxo**: ordenar os passos de um caminho pelo sistema.
- **Fluxo na Névoa**: passos em regiões ainda na Névoa aparecem como "??? (tipo de Ligação → região desconhecida)" até a revelação.
- **Classe como lente** (não filtro): muda o ângulo e a mistura de formatos.
  - Backend: contratos, dados, regras, efeitos colaterais.
  - Frontend: estado, telas, interação.
  - Fullstack: a travessia, com mais Traçar o fluxo.
- **Composição da Expedição**:
  - 5 Desafios gerados de uma vez.
  - ≥1 Traçar o fluxo (se a região tem Ligações) e ≥1 Apontar no código.
  - Dificuldade 1–5 crescente (só ordena).
- **Contestação**:
  - O Jogador explica por que o gabarito está errado; o Mestre reavalia o código.
  - Se reconhece o erro, o Desafio é anulado e o Jogador ganha o bônus de **Caçador de Slop**. Se mantém, explica.

## 6. Região desatualizada

Detalhe: [Como o Mestre decide que uma região mudou o suficiente para ficar desatualizada](https://github.com/Thyago331/quiz-your-slop/issues/10).

- **Detecção pelo Jogo, sem IA**:
  - O Jogo guarda, por região revelada, o commit da revelação e a lista de arquivos.
  - Ao abrir a Aventura, roda `git diff --numstat <commit> HEAD -- <arquivos>`.
  - A região fica desatualizada se:
    - ≥ 20% das linhas mudaram; ou
    - um arquivo foi apagado/renomeado; ou
    - surgiu arquivo novo nas pastas da região.
  - Só conta o que foi commitado.
  - Definições (#38):
    - "Linhas mudaram" = adicionadas + removidas nos arquivos da região ÷ linhas da região no commit da revelação (`numstat` da árvore vazia até esse commit). Arquivo binário conta 0 nos dois lados.
    - "Pastas da região" = a pasta de cada arquivo dela, sem as subpastas; arquivo novo é o que não existia nelas no commit da revelação.
    - Commit da revelação: o HEAD de cada repositório quando a Expedição vencedora foi preparada. Aventuras salvas antes disso usam o commit de criação.
- **Expedição sobre o que mudou**: o Jogo envia o `git diff` da região ao Mestre; se for grande demais, envia só a lista de arquivos alterados e a Expedição é tratada como região nova.
- **Revelar de novo**:
  - Redetalha arquivos e Ligações e atualiza o commit.
  - Ligações novas criam vizinhas; Ligações que sumiram não devolvem nada à Névoa.
- **Requisito**: o Projeto precisa ser um repositório git.

## 7. Ponte Jogo ↔ Mestre

Detalhe:
- [O que cada IA popular oferece para atuar como Mestre](https://github.com/Thyago331/quiz-your-slop/issues/2) → [`docs/research/ias-como-mestre.md`](research/ias-como-mestre.md).
- [Qual é o formato da ponte Jogo ↔ Mestre](https://github.com/Thyago331/quiz-your-slop/issues/6).
- [Qual é o contrato de dados de cada chamada ao Mestre](https://github.com/Thyago331/quiz-your-slop/issues/11) → [`docs/contrato-mestre.md`](contrato-mestre.md).

Decisões:
- **O Jogo conduz** e chama a CLI da IA em modo headless, como subprocesso, na pasta do Projeto. O Jogador nunca sai do Jogo.
- **IAs suportadas**: **Claude Code** e **Codex CLI** (validam JSON Schema), atrás de uma interface única de Mestre. Quem não tem nenhuma joga o Tutorial e entra numa lista de espera por IA.
- **Somente leitura, imposto pelo Jogo**:
  - Claude Code só com `Read`, `Grep`, `Glob`; Codex com `--sandbox read-only`.
  - Sem edição, sem shell, sem rede.
  - CLI sem modo restrito → o Jogo recusa.
- **Chamadas independentes**: a memória da Aventura mora no Jogo, que envia o contexto a cada chamada; dá para trocar de IA no meio da Aventura.
- **4 chamadas**:
  - `criar_aventura`;
  - `detalhar_regiao`;
  - `preparar_expedicao` (Desafios + Ligações escondidas, revelação sem nova chamada);
  - `contestar`.
- **Ids e idioma**: o Jogo cria todos os ids. Toda entrada leva `idioma` (`pt` | `en` | `es`).
- **Validação**:
  - Schema sempre.
  - **Evidências conferidas contra o arquivo** (existe, linhas no intervalo, trecho bate); referências a ids existentes; mistura mínima.
  - Desafio inválido é descartado e reposto (até 2 tentativas extras; roda com ≥3).
  - Saída inválida: até 2 novas tentativas, depois erro claro.

## 8. Privacidade e confiança

Detalhe: [O que pode cruzar a ponte Jogo ↔ Mestre](https://github.com/Thyago331/quiz-your-slop/issues/7).

- A ponte é local; a fronteira real é **máquina ↔ servidor**.
- **Sobe para o servidor**:
  - Conta, XP, Título e estatísticas (Expedições, acertos, Contestações vencidas).
  - Por Aventura: id opaco + Progresso (%) + Classe.
- **Nunca sai da máquina**: mapa (nomes de Regiões, Territórios, Ligações), caminhos, Desafios, gabaritos, Evidências, trechos de código, nome/caminho das pastas. O estado completo da Aventura é um arquivo local.
- **Garantias**:
  - Jogo desktop de código aberto.
  - Tela **"O que é enviado"** (linguagem clara + JSON exato do último envio).
  - Comando do Mestre visível com aviso de somente leitura.
  - Aviso de que o código é lido pela IA do Jogador e vai para o provedor dela.
- **Telemetria**:
  - Nenhuma telemetria no Jogo.
  - Relatório de erro opcional, sanitizado (caminhos → `<projeto>/...`) e editável antes de enviar.
  - Umami (sem cookie) apenas no site, mencionado na página de privacidade.

## 9. Tutorial — a Taverna do Slop

Detalhe:
- [Qual projeto fixo o tutorial usa](https://github.com/Thyago331/quiz-your-slop/issues/9).
- [Esboço da Taverna do Slop: Regiões, Ligações e slop plantado](https://github.com/Thyago331/quiz-your-slop/issues/13) → [`docs/prototipos/taverna-do-slop-esboco.md`](prototipos/taverna-do-slop-esboco.md).

O app:
- **Taverna do Slop**: app de pedidos de taverna de RPG feito sob medida, ~30 arquivos / ~1.500 linhas, TypeScript (React + API Node + SQL + worker de fila).
- O código **nunca muda**, em **inglês único**.

Mapa da Taverna:
- **4 Territórios**: Salão (`web/`), Balcão (`api/` + `shared/`), Adega (`db/`), Cozinha (`kitchen/`).
- **7 Regiões**: Cardápio, Carrinho e Checkout, API de Pedidos, Cofre do Anão, Grimório, Livro de Registros, Fogão. Os 4 tipos de Ligação aparecem.
- **Entradas**: Frontend → Cardápio; Backend → API de Pedidos; Fullstack → Carrinho e Checkout.

**Slop plantado**:
- Comentário mentiroso de idempotência em `charge()` (isca da Contestação roteirizada).
- Total calculado diferente no front e na API.
- `validateOrder()` com nome enganoso.
- `applyCoupon()` morto.
- `catch {}` engolindo erro no worker.

Como o Tutorial funciona:
- **Sem Mestre**:
  - Banco de ~10 Desafios escritos à mão por região (~70), no mesmo formato `Desafio` do contrato; cada Expedição sorteia 5 respeitando a mistura mínima.
  - A Classe só define a entrada.
  - A Contestação roteirizada usa `isca: true` e é resolvida sem IA.
- **Explorador de código embutido**: árvore + visualizador somente leitura ao lado do Desafio; Evidência clicável; arquivos de regiões na Névoa borrados.
- **Idiomas**: Desafios escritos em português e traduzidos para inglês e espanhol.

## 10. Plataforma, conta e distribuição

Detalhe: [Onde o Jogo roda e onde o progresso fica guardado](https://github.com/Thyago331/quiz-your-slop/issues/8).

- **Site**: conta, tutorial no navegador, download, vitrine pública.
- **Jogo desktop**: app gráfico com interface web embutida, **mesma interface do Tutorial**.
- **Servidor**: só progresso.
- **Plataformas**: Windows e Linux (AppImage + `.deb`).
- **Distribuição**:
  - GitHub Releases do repositório aberto, linkadas no site.
  - **Nada assinado pelo SO**. Para compensar: checksums SHA-256, GitHub artifact attestations e página explicando o aviso do SmartScreen e como verificar.
- **Atualização automática**: o app checa as Releases ao abrir e atualiza com um clique, verificando com a chave do projeto.
- **Conta obrigatória** para tudo, inclusive o Tutorial.
  - **Login só com GitHub OAuth**, escopo mínimo (identidade + e-mail), sem acesso a repositórios, dito explicitamente na tela.
  - No desktop: abre o navegador, recebe o token por redirect para `127.0.0.1:<porta>`.
- **Disponibilidade**: o Jogo não depende do servidor para jogar (só da internet da IA); o progresso sincroniza quando o servidor volta.

## 11. Stack e infra

Detalhe: [Qual é a stack técnica do Jogo, do site e do servidor](https://github.com/Thyago331/quiz-your-slop/issues/12).

- **Monorepo pnpm** público, TypeScript:
  - `apps/desktop`: Tauri 2.
  - `apps/site`: Next.js.
  - `packages/ui`: React compartilhado.
  - `packages/jogo`: regras, XP, validação do contrato.
- **Desktop**:
  - Lógica em TypeScript.
  - **Camada fina em Rust** com lista fechada de comandos (a interface não tem plugin de sistema de arquivos, shell, rede ou abertura de URLs; tudo passa por estes):
    - Mestre: `rodar_mestre` (a CLI headless e somente leitura), `detectar_mestre` (se a CLI está instalada e tem o modo restrito), `comando_do_mestre` (o comando exato, para o aviso "O Mestre só pode LER").
    - `git`: `rodar_git` (só as leituras permitidas: `rev-parse HEAD`, `diff`, `diff --numstat`, `ls-files`).
    - Arquivos do Projeto: `ler_arquivo` (para conferir Evidências, com teto de tamanho e sem sair da raiz).
    - Aventuras guardadas: `salvar_aventura`, `carregar_aventuras` (só em `<dados do app>/aventuras/<uuid>.json`).
    - Seletor de pastas: `escolher_pasta`.
    - Login e sessão: `entrar`, `cancelar_entrada`, `sessao_atual`, `sair`.
    - Sync do progresso: `sincronizar_progresso`, `estado_do_envio` (a tela "O que é enviado").
    - Relatório de erro: `abrir_relatorio` (só abre a issue nova do repositório do Jogo no navegador).
    - Atualização: `verificar_atualizacao`, `instalar_atualizacao`.
  - `rodar_mestre`, `rodar_git`, `ler_arquivo` e `comando_do_mestre` só aceitam raízes de Projeto que o Jogador escolheu no `escolher_pasta` ou que vêm das Aventuras guardadas (uma lista em memória, no Rust); qualquer outra pasta é recusada. `rodar_mestre` confere de novo, a cada sessão, se a CLI tem o modo restrito, e recusa se não tiver.
  - Compilado na CI, publicado no GitHub Releases.
- **Site + backend**: Next.js numa imagem Docker. Serve as páginas públicas, o Tutorial, a API de progresso (`/api/progresso`, `/api/health`) e o login via **Auth.js**. Banco: **Postgres**.
- **Infra**: VPS Hostinger, tudo em Docker, no padrão do `transito-analyzer`.
  - Imagem no GHCR.
  - `docker compose`: app + Postgres + Umami + Postgres do Umami.
  - Override para o Nginx do host terminar TLS.
  - Deploy por GitHub Actions após a CI: build → push → SSH `compose pull && up -d` → `/api/health` → smoke e2e.

## 12. Site, SEO, GEO e idiomas

Detalhe: [Qual é a stack técnica do Jogo, do site e do servidor](https://github.com/Thyago331/quiz-your-slop/issues/12).

- **Páginas públicas renderizadas no servidor**: início, como funciona, privacidade, FAQ e a vitrine **"Conheça a Taverna do Slop"** (mapa + Desafio de exemplo). A vitrine existe porque o Tutorial fica atrás do login.
- **SEO**:
  - Canonical + `hreflang`, `sitemap.xml`, `robots.txt`.
  - Open Graph com imagem por página.
  - JSON-LD (`SoftwareApplication`, `FAQPage`).
- **GEO**: `llms.txt` e texto "como funciona" citável por IAs.
- **Idiomas**: pt, en e es em site, Jogo e Tutorial. O Mestre gera no idioma do Jogador. `CONTEXT.md` segue em português; a interface traduz os termos.

## 13. Identidade visual e telas

Detalhe: [Como são o mapa e a tela de Expedição (o palco do game show)](https://github.com/Thyago331/quiz-your-slop/issues/14) → protótipo de referência [`docs/prototipos/palco/index.html`](prototipos/palco/index.html) (variante D; `?tela=` abre cada tela).

- **Estética**: **pixel art de JRPG**.
  - Fontes Press Start 2P (títulos) + VT323 (texto); código em monoespaçada normal.
  - Janelas azuis com borda branca, menus com cursor ▶, teclado ↑ ↓ Enter.
- **Mapa-mundi em tiles**:
  - Território = ilha.
  - Região = construção pixelada própria.
  - Ligação = estrada/ponte com o tipo em cor própria.
  - Névoa = nuvem pontilhada "???".
  - Estado pela moldura (★ revelada, tracejada desbloqueada, ⟳ desatualizada).
  - Herói marca a posição.
- **Expedição = batalha contra o Guardião** da região.
  - 4 vidas, cada acerto tira uma; errar não custa nada.
  - Contestação vencida = "GOLPE CRÍTICO — Caçador de Slop".
  - Evidência em pergaminho.
  - Tela de VITÓRIA com a Névoa recuando.
- **Telas do MVP**:
  1. **Título** (hub): Continuar, Nova Aventura, Tutorial, Perfil, O que é enviado, idioma.
  2. **Mapa** + aviso de **Região desatualizada** (linhas alteradas, arquivos novos).
  3. **Expedição/batalha**.
  4. **Nova Aventura em 5 passos**:
     1. Projeto: pastas + checagem de git.
     2. Mestre: CLIs detectadas, aviso "O Mestre só pode LER" + comando exato.
     3. Classe: Cavaleiro do Backend, Mago do Frontend, Bardo Fullstack.
     4. Leitura: progresso.
     5. Entrada: candidatas, sugestão destacada.
  5. **Tutorial**: batalha + explorador de código.
  6. **Perfil** (ficha de personagem).
  7. **O que é enviado**.
  8. **Site**: início/vitrine com Entrar com GitHub, downloads com checksums, 3 passos.

## 14. Referências

- Glossário: [`CONTEXT.md`](../CONTEXT.md)
- Contrato Jogo ↔ Mestre: [`docs/contrato-mestre.md`](contrato-mestre.md)
- Pesquisa das IAs: [`docs/research/ias-como-mestre.md`](research/ias-como-mestre.md)
- Esboço da Taverna: [`docs/prototipos/taverna-do-slop-esboco.md`](prototipos/taverna-do-slop-esboco.md)
- Protótipo visual: [`docs/prototipos/palco/index.html`](prototipos/palco/index.html)
- Padrão de infra: repositório `transito-analyzer` (`Dockerfile`, `deploy/`, `.github/workflows/deploy.yml`)
