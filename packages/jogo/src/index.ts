export { IDIOMAS, type Idioma, ehIdioma } from './idioma.ts';
export type {
  Classe,
  Desafio,
  EstadoRegiao,
  Evidencia,
  FormatoDesafio,
  Ligacao,
  Opcao,
  OpcaoApontar,
  OpcaoMultiplaEscolha,
  OpcaoTracarFluxo,
  RegiaoConhecida,
  RegiaoNova,
  TipoLigacao,
} from './contrato.ts';
export {
  conferirEvidencia,
  type LerArquivo,
  type MotivoEvidenciaInvalida,
  type ResultadoEvidencia,
} from './evidencia.ts';
export {
  iniciarMapa,
  progresso,
  revelar,
  vizinhas,
  type EstadoNoMapa,
  type EstruturaMapa,
  type LigacaoMapa,
  type MapaAventura,
  type ProgressoAventura,
} from './mapa.ts';
