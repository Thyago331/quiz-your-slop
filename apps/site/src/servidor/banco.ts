import 'server-only';
import postgres, { type Sql } from 'postgres';

// Um pool por processo do servidor, aberto no primeiro uso: o build não toca no banco.
let compartilhado: Sql | undefined;

export function banco(): Sql {
  if (!compartilhado) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não definida (veja apps/site/.env.example)');
    compartilhado = postgres(url, { max: 5 });
  }
  return compartilhado;
}
