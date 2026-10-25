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
  conferirOpcaoApontar,
  type LerArquivo,
  type MotivoEvidenciaInvalida,
  type ResultadoEvidencia,
  type ResultadoOpcaoApontar,
} from './evidencia.ts';
export { passoDoFluxo, type PassoNaTela } from './fluxo.ts';
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
export { concluirExpedicao, iniciarAventura, type Aventura } from './aventura.ts';
export { corrigir, type Resposta } from './correcao.ts';
export {
  VIDAS_DO_GUARDIAO,
  acertosDa,
  avancar,
  chaveDoDesafio,
  desafioAtual,
  desafiosJogados,
  escolherDesafios,
  guardiaoDerrotado,
  iniciarExpedicao,
  responderDesafio,
  resultadoDaExpedicao,
  vidasDoGuardiao,
  type Aleatorio,
  type Expedicao,
  type FaseExpedicao,
  type OpcoesDaEscolha,
  type RespostaDada,
  type ResultadoExpedicao,
} from './expedicao.ts';
export {
  CALIBRAGEM_PADRAO,
  tituloDoXp,
  type Calibragem,
  type Titulo,
  type TituloDoXp,
} from './progressao.ts';
