// Login no Jogo desktop (spec §10): o navegador entrega ao app um código de uso único (5 min), que o
// app troca, provando o desafio PKCE, por um token de longa duração. O banco só guarda o SHA-256 dos
// dois, nunca o valor: um vazamento da tabela não dá acesso a conta nenhuma. O token expira e pode
// ser revogado (o "Sair" do Jogo).
export const sql = `
CREATE TABLE codigo_desktop (
  hash text PRIMARY KEY CHECK (hash ~ '^[0-9a-f]{64}$'),
  jogador_id uuid NOT NULL REFERENCES jogador (id) ON DELETE CASCADE,
  desafio text NOT NULL CHECK (desafio ~ '^[A-Za-z0-9_-]{43}$'),
  expira_em timestamptz NOT NULL
);

CREATE TABLE token_desktop (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogador_id uuid NOT NULL REFERENCES jogador (id) ON DELETE CASCADE,
  hash text NOT NULL UNIQUE CHECK (hash ~ '^[0-9a-f]{64}$'),
  criado_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz NOT NULL,
  revogado_em timestamptz
);

CREATE INDEX token_desktop_jogador ON token_desktop (jogador_id);
`;
