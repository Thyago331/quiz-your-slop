import {
  ESTATISTICAS_ZERADAS,
  MAXIMO_DE_AVENTURAS,
  lerEnvio,
  mesclarProgresso,
  tituloDoXp,
  type AventuraEnviada,
  type Classe,
  type EnvioDeProgresso,
} from '@quiz/jogo';
import type { Sql, TransactionSql } from 'postgres';

/** O progresso guardado do Jogador e o JSON exato do último envio aceito ("O que é enviado"). */
export type ProgressoGuardado = {
  progresso: EnvioDeProgresso;
  ultimoEnvio: EnvioDeProgresso | null;
  ultimoEnvioEm: Date | null;
};

type LinhaProgresso = {
  xp: number;
  expedicoes: number;
  acertos: number;
  contestacoes_vencidas: number;
  ultimo_envio: EnvioDeProgresso | null;
  ultimo_envio_em: Date | null;
};

type LinhaAventura = { aventura_id: string; progresso: number; classe: Classe };

export const PROGRESSO_ZERADO: EnvioDeProgresso = {
  xp: 0,
  titulo: tituloDoXp(0).atual.nome,
  estatisticas: ESTATISTICAS_ZERADAS,
  aventuras: [],
};

function montar(linha: LinhaProgresso, aventuras: LinhaAventura[]): EnvioDeProgresso {
  return {
    xp: linha.xp,
    titulo: tituloDoXp(linha.xp).atual.nome,
    estatisticas: {
      expedicoes: linha.expedicoes,
      acertos: linha.acertos,
      contestacoes_vencidas: linha.contestacoes_vencidas,
    },
    aventuras: aventuras.map((a): AventuraEnviada => ({
      id: a.aventura_id,
      progresso: a.progresso,
      classe: a.classe,
    })),
  };
}

async function ler(sql: Sql | TransactionSql, jogadorId: string, travar: boolean) {
  const [linha] = travar
    ? await sql<LinhaProgresso[]>`
        SELECT xp, expedicoes, acertos, contestacoes_vencidas, ultimo_envio, ultimo_envio_em
        FROM progresso WHERE jogador_id = ${jogadorId} FOR UPDATE`
    : await sql<LinhaProgresso[]>`
        SELECT xp, expedicoes, acertos, contestacoes_vencidas, ultimo_envio, ultimo_envio_em
        FROM progresso WHERE jogador_id = ${jogadorId}`;
  if (!linha) return null;
  const aventuras = await sql<LinhaAventura[]>`
    SELECT aventura_id, progresso, classe FROM progresso_aventura
    WHERE jogador_id = ${jogadorId} ORDER BY ordem
  `;
  return { linha, progresso: montar(linha, aventuras) };
}

export async function progressoDoJogador(
  sql: Sql,
  jogadorId: string,
): Promise<ProgressoGuardado | null> {
  const lido = await ler(sql, jogadorId, false);
  if (!lido) return null;
  return {
    progresso: lido.progresso,
    ultimoEnvio: lido.linha.ultimo_envio,
    ultimoEnvioEm: lido.linha.ultimo_envio_em,
  };
}

export type Salvo = { ok: true; progresso: EnvioDeProgresso } | { ok: false; erro: string };

/**
 * Junta o envio (já validado por lerEnvio) ao guardado, numa transação com a linha travada: dois
 * envios ao mesmo tempo não se atropelam. A regra da junção é mesclarProgresso.
 */
export async function salvarProgresso(
  sql: Sql,
  jogadorId: string,
  envio: EnvioDeProgresso,
): Promise<Salvo> {
  return sql.begin(async (tx) => {
    await tx`INSERT INTO progresso (jogador_id) VALUES (${jogadorId}) ON CONFLICT DO NOTHING`;
    const guardado = await ler(tx, jogadorId, true);
    const mesclado = mesclarProgresso(guardado?.progresso ?? null, envio);
    if (mesclado.aventuras.length > MAXIMO_DE_AVENTURAS)
      return { ok: false, erro: `no máximo ${MAXIMO_DE_AVENTURAS} Aventuras por Jogador` };
    const { xp, estatisticas: e } = mesclado;
    await tx`
      UPDATE progresso SET
        xp = ${xp},
        expedicoes = ${e.expedicoes},
        acertos = ${e.acertos},
        contestacoes_vencidas = ${e.contestacoes_vencidas},
        -- Como texto: sql.json passaria por jsonb e perderia a ordem das chaves.
        ultimo_envio = ${JSON.stringify(envio)}::text::json,
        ultimo_envio_em = now(),
        atualizado_em = now()
      WHERE jogador_id = ${jogadorId}
    `;
    for (const [ordem, a] of mesclado.aventuras.entries()) {
      await tx`
        INSERT INTO progresso_aventura (jogador_id, aventura_id, progresso, classe, ordem)
        VALUES (${jogadorId}, ${a.id}, ${a.progresso}, ${a.classe}, ${ordem})
        ON CONFLICT (jogador_id, aventura_id) DO UPDATE SET
          progresso = EXCLUDED.progresso,
          classe = EXCLUDED.classe,
          ordem = EXCLUDED.ordem,
          atualizado_em = now()
      `;
    }
    return { ok: true as const, progresso: mesclado };
  });
}

/** Corpo maior que isto não é progresso (100 Aventuras cabem com folga). */
export const TAMANHO_MAXIMO_DO_CORPO = 16_384;

export type PedidoDeProgresso =
  | { metodo: 'GET'; jogadorId: string | null }
  | { metodo: 'PUT'; jogadorId: string | null; corpo: string };

export type RespostaDeProgresso = { status: number; corpo: EnvioDeProgresso | { erro: string } };

const ehViolacaoDeChave = (erro: unknown) =>
  typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === '23503';

/**
 * A API /api/progresso sem o Next em volta, para testar contra o banco: GET devolve o progresso
 * guardado; PUT valida o corpo contra a lista permitida (400 em qualquer campo a mais), junta e
 * devolve o resultado. Sem sessão, 401 (sem nem abrir o banco).
 */
export async function responderProgresso(
  banco: () => Sql,
  pedido: PedidoDeProgresso,
): Promise<RespostaDeProgresso> {
  const { jogadorId } = pedido;
  if (!jogadorId) return { status: 401, corpo: { erro: 'Entre com o GitHub para salvar.' } };
  if (pedido.metodo === 'GET') {
    const guardado = await progressoDoJogador(banco(), jogadorId);
    return { status: 200, corpo: guardado?.progresso ?? PROGRESSO_ZERADO };
  }
  if (pedido.corpo.length > TAMANHO_MAXIMO_DO_CORPO)
    return { status: 413, corpo: { erro: 'corpo grande demais' } };
  let dado: unknown;
  try {
    dado = JSON.parse(pedido.corpo);
  } catch {
    return { status: 400, corpo: { erro: 'corpo não é JSON' } };
  }
  const lido = lerEnvio(dado);
  if (!lido.ok) return { status: 400, corpo: { erro: lido.erro } };
  try {
    const salvo = await salvarProgresso(banco(), jogadorId, lido.envio);
    return salvo.ok
      ? { status: 200, corpo: salvo.progresso }
      : { status: 400, corpo: { erro: salvo.erro } };
  } catch (erro) {
    // Sessão de um Jogador que não existe mais no banco.
    if (ehViolacaoDeChave(erro)) return { status: 401, corpo: { erro: 'Jogador desconhecido.' } };
    throw erro;
  }
}
