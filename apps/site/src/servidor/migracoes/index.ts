import * as jogador from './0001-jogador.ts';

export type Migracao = { nome: string; sql: string };

// Em ordem, só se acrescenta no fim; uma migração aplicada nunca muda. São módulos TS, não
// arquivos .sql, para entrarem no bundle do servidor standalone sem rastreio de arquivos.
export const MIGRACOES: readonly Migracao[] = [{ nome: '0001-jogador', sql: jogador.sql }];
