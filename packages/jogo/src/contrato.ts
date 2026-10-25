// Tipos compartilhados do contrato Jogo ↔ Mestre (docs/contrato-mestre.md).
// Os nomes de campo seguem o contrato ao pé da letra: são o formato do JSON trocado com o Mestre.
export type { Idioma } from './idioma.ts';

export type Classe = 'backend' | 'frontend' | 'fullstack';
export type TipoLigacao = 'chamada' | 'consulta' | 'evento' | 'dependencia';
export type EstadoRegiao = 'desbloqueada' | 'revelada' | 'desatualizada';

/** Como o Jogo descreve o mapa ao Mestre. */
export type RegiaoConhecida = {
  id: string;
  nome: string;
  resumo: string;
  territorio_id: string;
  estado: EstadoRegiao;
  /** Vazio se ainda não detalhada. */
  arquivos: string[];
};

/** Região que o Mestre propõe (sem id). */
export type RegiaoNova = {
  nome: string;
  resumo: string;
  /** null = Território novo (ver territorio_novo). */
  territorio_id: string | null;
  territorio_novo?: { nome: string; raizes: string[] };
  /** 1–5 arquivos que ancoram a região. */
  arquivos_semente: string[];
};

export type Evidencia = {
  caminho: string;
  /** 1-based, inclusivo. */
  linha_inicio: number;
  linha_fim: number;
  /** Conteúdo exato dessas linhas. */
  trecho: string;
};

export type FormatoDesafio = 'multipla_escolha' | 'apontar' | 'tracar_fluxo';

export type OpcaoMultiplaEscolha = { id: string; texto: string };
/** Arquivo, ou arquivo + função. */
export type OpcaoApontar = { id: string; caminho: string; simbolo?: string };
/** regiao_id null = passo na Névoa; ligacao = tipo da Ligação ao entrar neste passo. */
export type OpcaoTracarFluxo = {
  id: string;
  texto: string;
  regiao_id: string | null;
  ligacao?: TipoLigacao;
};
export type Opcao = OpcaoMultiplaEscolha | OpcaoApontar | OpcaoTracarFluxo;

export type Desafio = {
  id?: string;
  formato: FormatoDesafio;
  enunciado: string;
  dificuldade: 1 | 2 | 3 | 4 | 5;
  opcoes: Opcao[];
  /** Ids de opções: 1 (múltipla escolha), ≥1 aceitas (apontar), ordem completa (traçar o fluxo). */
  gabarito: string[];
  explicacao: string;
  /** ≥1. */
  evidencias: Evidencia[];
  /** Só Tutorial: gabarito propositalmente errado (Contestação roteirizada). */
  isca?: boolean;
};

export type Ligacao = {
  tipo: TipoLigacao;
  descricao: string;
  destino: { regiao_id: string } | { nova: RegiaoNova };
  /** Onde a comunicação acontece no código. */
  evidencias: Evidencia[];
};

/** Saída da chamada `contestar` (contrato §4): o Mestre reavalia o gabarito contestado. */
export type SaidaContestar = {
  veredito: 'mantido' | 'anulado';
  explicacao: string;
  evidencias: Evidencia[];
};
