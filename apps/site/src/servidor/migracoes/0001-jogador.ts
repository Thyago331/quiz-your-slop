// A conta do Jogador: só a identidade do GitHub (spec §10). O progresso vem depois e se pendura no id.
export const sql = `
CREATE TABLE jogador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id bigint NOT NULL UNIQUE,
  login text NOT NULL,
  nome text,
  email text,
  avatar_url text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
`;
