// Progresso sem conteúdo (spec §8): XP e estatísticas por Jogador, e por Aventura só id opaco,
// Progresso (%) e Classe. Colunas tipadas, não JSONB livre: o banco também recusa o que não cabe.
// `ultimo_envio` guarda o JSON exato do último envio aceito, para a tela "O que é enviado"; ele
// passou por lerEnvio, então só tem os campos da lista permitida. É `json` e não `jsonb` para
// manter a ordem das chaves como foi enviada.
export const sql = `
CREATE TABLE progresso (
  jogador_id uuid PRIMARY KEY REFERENCES jogador (id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  expedicoes integer NOT NULL DEFAULT 0 CHECK (expedicoes >= 0),
  acertos integer NOT NULL DEFAULT 0 CHECK (acertos >= 0),
  contestacoes_vencidas integer NOT NULL DEFAULT 0
    CHECK (contestacoes_vencidas >= 0 AND contestacoes_vencidas <= acertos),
  ultimo_envio json,
  ultimo_envio_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE progresso_aventura (
  jogador_id uuid NOT NULL REFERENCES jogador (id) ON DELETE CASCADE,
  aventura_id text NOT NULL CHECK (
    aventura_id = 'tutorial'
    OR aventura_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ),
  progresso smallint NOT NULL CHECK (progresso BETWEEN 0 AND 100),
  classe text NOT NULL CHECK (classe IN ('backend', 'frontend', 'fullstack')),
  ordem integer NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (jogador_id, aventura_id)
);
`;
