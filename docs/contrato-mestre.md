# Contrato Jogo ↔ Mestre (rascunho)

Decidido em [Qual é o contrato de dados de cada chamada ao Mestre](https://github.com/Thyago331/quiz-your-slop/issues/11). Vocabulário em [`CONTEXT.md`](../CONTEXT.md).

## Princípios

- **O Jogo conduz.** Cada chamada é uma sessão nova da CLI da IA (Claude Code ou Codex), headless e somente leitura, na pasta do Projeto. Entrada = instruções do papel de Mestre + JSON de contexto. Saída = JSON validado contra o schema da chamada (`--json-schema` / `--output-schema`).
  - **Codex**: o `--output-schema` usa o modo estrito da OpenAI (todo campo em `required`, `additionalProperties: false`). O adaptador manda o mesmo schema com cada campo opcional obrigatório e anulável, e tira os `null` desses campos antes da validação; a saída é a última mensagem (`--output-last-message`), o JSON puro. O `--add-dir` do Codex é de escrita, então não é usado: o sandbox `read-only` já lê os outros repositórios do Projeto.
- **A memória mora no Jogo.** O Mestre não lembra de nada entre chamadas; tudo que ele precisa vem na entrada. Por isso trocar de Mestre no meio da Aventura só muda o campo `mestre` dela.
- **O Jogo cria os ids.** Regiões, Territórios, Ligações e Desafios recebem ids gerados pelo Jogo. O Mestre só referencia ids que recebeu na entrada; algo novo vem sem id e o Jogo atribui.
- **Caminhos são relativos à raiz do repositório**, prefixados pelo repositório quando o Projeto tem mais de um (`loja-api:src/orders/service.ts`).
- **Idioma do Jogador.** Toda entrada leva `idioma` (`"pt" | "en" | "es"`); todo texto que o Mestre devolve (nomes, resumos, enunciados, explicações) vem nesse idioma. Caminhos, símbolos e trechos de código ficam como estão no repositório.
- **O mesmo formato serve ao Tutorial.** Os Desafios escritos à mão da Taverna do Slop usam o tipo `Desafio` abaixo.

## Tipos compartilhados

```ts
type Classe = "backend" | "frontend" | "fullstack";
type Idioma = "pt" | "en" | "es";   // presente em toda entrada, omitido abaixo por brevidade
type TipoLigacao = "chamada" | "consulta" | "evento" | "dependencia";

type RegiaoConhecida = {        // como o Jogo descreve o mapa ao Mestre
  id: string;
  nome: string;
  resumo: string;
  territorio_id: string;
  estado: "desbloqueada" | "revelada" | "desatualizada";
  arquivos: string[];           // vazio se ainda não detalhada
};

type RegiaoNova = {             // região que o Mestre propõe (sem id)
  nome: string;                 // ex.: "API de pedidos"
  resumo: string;               // 1–2 frases, sem jargão interno
  territorio_id: string | null; // null = Território novo (ver territorio_novo)
  territorio_novo?: { nome: string; raizes: string[] };
  arquivos_semente: string[];   // 1–5 arquivos que ancoram a região
};

type Evidencia = {
  caminho: string;
  linha_inicio: number;         // 1-based, inclusivo
  linha_fim: number;
  trecho: string;               // conteúdo exato dessas linhas
};

type Desafio = {
  id?: string;                  // atribuído pelo Jogo
  formato: "multipla_escolha" | "apontar" | "tracar_fluxo";
  enunciado: string;
  dificuldade: 1 | 2 | 3 | 4 | 5;
  opcoes: Opcao[];
  gabarito: string[];           // ids de opções: 1 (múltipla escolha), ≥1 aceitas (apontar), ordem completa (traçar o fluxo)
  explicacao: string;
  evidencias: Evidencia[];      // ≥1
  isca?: boolean;               // só Tutorial: gabarito propositalmente errado (Contestação roteirizada)
};

type Opcao =
  | { id: string; texto: string }                                   // multipla_escolha
  | { id: string; caminho: string; simbolo?: string }               // apontar (arquivo ou arquivo + função)
  | { id: string; texto: string; regiao_id: string | null;          // tracar_fluxo; regiao_id null = passo na Névoa
      ligacao?: TipoLigacao };                                      //   tipo da Ligação ao entrar neste passo

type Ligacao = {
  tipo: TipoLigacao;
  descricao: string;            // ex.: "POST /orders cria o pedido"
  destino: { regiao_id: string } | { nova: RegiaoNova };
  evidencias: Evidencia[];      // onde a comunicação acontece no código
};
```

## As 4 chamadas

### 1. `criar_aventura`

Quando: o Jogador cria uma Aventura (escolhe pastas e Classe).

```ts
entrada: {
  repositorios: { nome: string; caminho_local: string }[];
  classe: Classe;
}
saida: {
  territorios: { nome: string; resumo: string; raizes: string[] }[];
  candidatas_entrada: (RegiaoNova & { motivo: string })[];   // 1–3, a primeira é a sugestão da Classe
  aviso_classe?: string;   // ex.: "Projeto não tem front; sugerindo a entrada mais próxima"
}
```

O Jogador confirma uma candidata; o Jogo cria Territórios e a região de entrada e chama `detalhar_regiao`.

### 2. `detalhar_regiao`

Quando: uma região é desbloqueada (entrada confirmada ou vizinha nova).

```ts
entrada: {
  regiao: RegiaoConhecida & { arquivos_semente: string[] };
  mapa: RegiaoConhecida[];      // regiões conhecidas, para evitar sobreposição
  classe: Classe;
}
saida: {
  resumo: string;
  arquivos: string[];           // lista completa de arquivos da região
  dividir?: RegiaoNova[];       // se grande demais: substitui a região por estas
}
```

### 3. `preparar_expedicao`

Quando: o Jogador inicia uma Expedição.

```ts
entrada: {
  regiao: RegiaoConhecida;
  mapa: RegiaoConhecida[];
  classe: Classe;
  desafios_anteriores: string[];      // enunciados já vistos nesta região (não repetir)
  ligacoes_conhecidas: boolean;       // true = já descobertas numa tentativa anterior; não precisa devolver
  mudancas?: {                        // só em Região desatualizada
    diff?: string;                    // git diff <commit da revelação> HEAD -- arquivos da região
    arquivos_alterados: string[];     // sempre presente; diff omitido se grande demais
  };
  quantidade: number;                 // normalmente 5; menos ao repor Desafios descartados
}
saida: {
  desafios: Desafio[];
  ligacoes?: Ligacao[];               // omitido se ligacoes_conhecidas
  arquivos_atualizados?: string[];    // só em Região desatualizada
}
```

O Jogo guarda as Ligações escondidas; ao vencer a Expedição, revela-as sem nova chamada.

### 4. `contestar`

Quando: o Jogador contesta um gabarito.

```ts
entrada: {
  desafio: Desafio;
  resposta_jogador: string[];         // ids de opções escolhidos
  argumento: string;                  // texto livre do Jogador
}
saida: {
  veredito: "mantido" | "anulado";
  explicacao: string;
  evidencias: Evidencia[];
}
```

As Evidências do veredito passam pela mesma conferência da preparação; as que não batem com o arquivo são descartadas. Anular exige prova: um `anulado` sem nenhuma Evidência válida é recusado e pedido de novo (até 2 novas tentativas); se ainda assim não vier prova, o gabarito fica mantido, com a explicação e as Evidências do próprio Desafio, e o Jogador vê que o Mestre não conseguiu provar a anulação.

No Tutorial, `contestar` não chama IA: um Desafio com `isca: true` é anulado com um texto fixo.

## Validação no Jogo

1. **Schema**: toda saída é validada contra o JSON Schema da chamada (mesmo quando a CLI já garante).
2. **Evidências**: para cada `Evidencia`, o Jogo confere que o arquivo existe, as linhas estão no intervalo e o `trecho` bate com o conteúdo (ignorando espaços). Opções de `apontar` precisam apontar para arquivos (e símbolos) existentes.
3. **Referências**: todo `regiao_id`/`territorio_id` citado precisa existir no mapa enviado.
4. **Desafios**: `gabarito` só usa ids de `opcoes`; mistura mínima por Expedição (≥1 `tracar_fluxo` se a região tem Ligações, ≥1 `apontar`).
5. **Falhas**:
   - Desafio inválido → descartado. Se sobrarem menos de 5 válidos, o Jogo pede só os que faltam (`quantidade`), até **2 tentativas extras**. Com ≥3 válidos a Expedição roda; com menos, o Jogo mostra erro e oferece tentar de novo.
   - Saída inteira inválida (schema, referências) → até 2 novas tentativas da mesma chamada; depois, erro claro ao Jogador com opção de enviar relatório sanitizado.
