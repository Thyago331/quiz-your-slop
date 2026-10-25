import NextAuth, { type DefaultSession } from 'next-auth';
import 'next-auth/jwt';
import GitHub from 'next-auth/providers/github';
import { banco } from '@/servidor/banco';
import { salvarJogador } from '@/servidor/jogador';

// Identidade + e-mail, nada de repositórios (spec §10). Fixado aqui para não depender do padrão
// do provedor; a tela de login promete exatamente isto.
export const ESCOPO_GITHUB = 'read:user user:email';

declare module 'next-auth' {
  interface Session {
    user: { jogadorId: string; login: string } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    jogadorId?: string;
    login?: string;
  }
}

// Sessão em JWT (cookie cifrado com AUTH_SECRET): o banco só é tocado no login, para criar ou
// atualizar o Jogador; nenhuma requisição depois disso consulta sessão no Postgres.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub({ authorization: { params: { scope: ESCOPO_GITHUB } } })],
  session: { strategy: 'jwt' },
  pages: { signIn: '/entrar', error: '/entrar' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'github' && profile) {
        const jogador = await salvarJogador(banco(), {
          githubId: Number(profile.id),
          login: String(profile.login),
          nome: profile.name ?? null,
          email: profile.email ?? null,
          avatarUrl: typeof profile.avatar_url === 'string' ? profile.avatar_url : null,
        });
        token.jogadorId = jogador.id;
        token.login = jogador.login;
      }
      return token;
    },
    session({ session, token }) {
      if (token.jogadorId) session.user.jogadorId = token.jogadorId;
      if (token.login) session.user.login = token.login;
      return session;
    },
  },
});
