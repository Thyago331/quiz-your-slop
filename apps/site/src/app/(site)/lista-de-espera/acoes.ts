'use server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { banco } from '@/servidor/banco';
import { salvarInscricao, validarInscricao } from '@/servidor/lista-de-espera';

export type EstadoInscricao = { erro?: string; salvo?: boolean };

/** Registra (ou troca) a IA do Jogador logado na lista de espera. */
export async function inscrever(
  _anterior: EstadoInscricao,
  formulario: FormData,
): Promise<EstadoInscricao> {
  const sessao = await auth();
  if (!sessao?.user.jogadorId) return { erro: 'Entre com GitHub para entrar na lista.' };
  const validacao = validarInscricao({ ia: formulario.get('ia'), outra: formulario.get('outra') });
  if (!validacao.ok) return { erro: validacao.erro };
  await salvarInscricao(banco(), sessao.user.jogadorId, validacao.inscricao);
  revalidatePath('/lista-de-espera');
  return { salvo: true };
}
