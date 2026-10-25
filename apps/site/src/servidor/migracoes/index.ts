import * as jogador from './0001-jogador.ts';
import * as listaDeEspera from './0002-lista-de-espera.ts';
import * as progresso from './0003-progresso.ts';
import * as tokenDesktop from './0004-token-desktop.ts';

export type Migracao = { nome: string; sql: string };

// Em ordem, só se acrescenta no fim; uma migração aplicada nunca muda. São módulos TS, não
// arquivos .sql, para entrarem no bundle do servidor standalone sem rastreio de arquivos.
export const MIGRACOES: readonly Migracao[] = [
  { nome: '0001-jogador', sql: jogador.sql },
  { nome: '0002-lista-de-espera', sql: listaDeEspera.sql },
  { nome: '0003-progresso', sql: progresso.sql },
  { nome: '0004-token-desktop', sql: tokenDesktop.sql },
];
