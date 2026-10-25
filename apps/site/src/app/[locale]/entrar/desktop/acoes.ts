'use server';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { banco } from '@/servidor/banco';
import { emitirCodigo, lerPedidoDeConexao, urlDeRetorno } from '@/servidor/desktop';

type Dados = { porta: string; estado: string; desafio: string };

// Os dados vêm do cliente: valem de novo aqui, e o retorno é sempre 127.0.0.1.

/** O Jogador confirmou: emite o código e devolve o navegador ao Jogo. */
export async function conectarDesktop(dados: Dados) {
  const pedido = lerPedidoDeConexao(dados);
  const sessao = await auth();
  if (!pedido || !sessao?.user.jogadorId) return;
  const codigo = await emitirCodigo(banco(), sessao.user.jogadorId, pedido.desafio);
  redirect(urlDeRetorno(pedido, { codigo }));
}

/** O Jogador recusou: o Jogo para de esperar. */
export async function recusarDesktop(dados: Dados) {
  const pedido = lerPedidoDeConexao(dados);
  if (pedido) redirect(urlDeRetorno(pedido, { erro: 'recusado' }));
}
