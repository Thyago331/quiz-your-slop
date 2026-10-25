import type { Sql } from 'postgres';

/** O que o GitHub diz de quem entrou (escopo `read:user user:email`). */
export type PerfilGithub = {
  githubId: number;
  login: string;
  nome: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type Jogador = PerfilGithub & { id: string };

/**
 * Cria o Jogador no primeiro login e atualiza login, nome, e-mail e avatar nos seguintes: a conta
 * é a identidade do GitHub, então a chave é o `github_id` (o login pode mudar).
 */
export async function salvarJogador(sql: Sql, perfil: PerfilGithub): Promise<Jogador> {
  const [linha] = await sql<{ id: string }[]>`
    INSERT INTO jogador (github_id, login, nome, email, avatar_url)
    VALUES (${perfil.githubId}, ${perfil.login}, ${perfil.nome}, ${perfil.email}, ${perfil.avatarUrl})
    ON CONFLICT (github_id) DO UPDATE SET
      login = EXCLUDED.login,
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      avatar_url = EXCLUDED.avatar_url,
      atualizado_em = now()
    RETURNING id
  `;
  if (!linha) throw new Error('salvarJogador: o banco não devolveu o Jogador');
  return { ...perfil, id: linha.id };
}
