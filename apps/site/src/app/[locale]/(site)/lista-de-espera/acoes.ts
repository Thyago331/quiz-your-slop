'use server';
import { revalidatePath } from 'next/cache';
import { formatar } from '@quiz/i18n';
import { auth } from '@/auth';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { banco } from '@/servidor/banco';
import {
  salvarInscricao,
  TAMANHO_MAXIMO_OUTRA,
  validarInscricao,
} from '@/servidor/lista-de-espera';
import { LISTA } from '@/textos/lista-de-espera';

export type EstadoInscricao = { erro?: string; salvo?: boolean };

/** Registra (ou troca) a IA do Jogador logado na lista de espera. */
export async function inscrever(
  _anterior: EstadoInscricao,
  formulario: FormData,
): Promise<EstadoInscricao> {
  const t = LISTA[await idiomaDaRequisicao()];
  const sessao = await auth();
  if (!sessao?.user.jogadorId) return { erro: t.semConta };
  const validacao = validarInscricao({ ia: formulario.get('ia'), outra: formulario.get('outra') });
  if (!validacao.ok)
    return { erro: formatar(t.erros[validacao.erro], { maximo: TAMANHO_MAXIMO_OUTRA }) };
  await salvarInscricao(banco(), sessao.user.jogadorId, validacao.inscricao);
  revalidatePath('/[locale]/lista-de-espera', 'page');
  return { salvo: true };
}
