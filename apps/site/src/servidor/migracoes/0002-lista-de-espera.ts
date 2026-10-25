// Lista de espera por IA (spec §7): quem não tem Claude Code nem Codex diz qual IA usa, para
// orientar o próximo adaptador. Uma linha por Jogador; reenviar troca a escolha.
export const sql = `
CREATE TABLE lista_de_espera (
  jogador_id uuid PRIMARY KEY REFERENCES jogador (id) ON DELETE CASCADE,
  ia text NOT NULL CHECK (ia IN ('gemini', 'cursor', 'copilot', 'outra')),
  outra text CHECK (outra IS NULL OR (ia = 'outra' AND length(outra) BETWEEN 1 AND 80)),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
`;
