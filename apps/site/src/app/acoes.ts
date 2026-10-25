'use server';
import { signIn, signOut } from '@/auth';
import { destinoSeguro } from '@/servidor/destino';

export async function entrarComGithub(de: string) {
  await signIn('github', { redirectTo: destinoSeguro(de) });
}

export async function sair() {
  await signOut({ redirectTo: '/' });
}
