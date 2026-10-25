'use server';
import { IDIOMA_PADRAO, ehIdioma } from '@quiz/i18n';
import { signIn, signOut } from '@/auth';
import { caminhoNoIdioma } from '@/i18n/caminhos';
import { destinoSeguro } from '@/servidor/destino';

export async function entrarComGithub(de: string) {
  await signIn('github', { redirectTo: destinoSeguro(de) });
}

/** Sai e volta à inicial no idioma em que estava. */
export async function sair(idioma: string) {
  await signOut({ redirectTo: caminhoNoIdioma(ehIdioma(idioma) ? idioma : IDIOMA_PADRAO, '/') });
}
