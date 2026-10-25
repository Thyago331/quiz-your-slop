// A sincronia do progresso com o site (spec §8, §10). Nunca segura o jogo: tudo corre por trás e
// qualquer falha só deixa o envio pendente para a próxima tentativa (ao abrir o Jogo, no fim de cada
// Expedição, ao entrar com o GitHub e a cada 5 minutos enquanto houver pendente).
//
// O XP do Jogador é um contador só, como no Tutorial do site: começa no maior entre a soma das
// Aventuras daqui, o último envio pendente e o que o site devolveu por último, e cada Expedição
// soma o que ganhou. Assim o XP do Tutorial (que mora no navegador) entra no Título daqui, e o
// site, que junta pelo maior, não perde nada. As Aventuras vão todas; o Tutorial não vai: o site
// guarda as Aventuras que não vieram num envio, e a dele é atualizada pelo navegador.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ESTATISTICAS_ZERADAS,
  MAXIMO_DE_AVENTURAS,
  lerEnvio,
  mesclarEstatisticas,
  montarEnvio,
  type AventuraNoProjeto,
  type EnvioDeProgresso,
  type EstatisticasDoJogador,
} from '@quiz/jogo';
import * as sistema from './sistema.ts';
import type { EstadoDoEnvio, Sincronia } from './sistema.ts';

export const INTERVALO_DA_SINCRONIA = 5 * 60_000;

export type ProgressoDoJogador = { xp: number; estatisticas: EstatisticasDoJogador };

export const PROGRESSO_ZERADO: ProgressoDoJogador = { xp: 0, estatisticas: ESTATISTICAS_ZERADAS };

/** Cada campo fica com o maior dos dois. */
export function maior(a: ProgressoDoJogador, b: ProgressoDoJogador): ProgressoDoJogador {
  return {
    xp: Math.max(a.xp, b.xp),
    estatisticas: mesclarEstatisticas(a.estatisticas, b.estatisticas),
  };
}

export function somaDasAventuras(aventuras: readonly AventuraNoProjeto[]): ProgressoDoJogador {
  return aventuras.reduce<ProgressoDoJogador>(
    (soma, a) => somarDiferenca(soma, PROGRESSO_ZERADO, a),
    PROGRESSO_ZERADO,
  );
}

/** Soma ao contador o que a Aventura ganhou de `antes` para `depois` (nunca subtrai). */
export function somarDiferenca(
  jogador: ProgressoDoJogador,
  antes: ProgressoDoJogador,
  depois: ProgressoDoJogador,
): ProgressoDoJogador {
  const mais = (a: number, b: number) => Math.max(0, b - a);
  const [e, a, d] = [jogador.estatisticas, antes.estatisticas, depois.estatisticas];
  return {
    xp: jogador.xp + mais(antes.xp, depois.xp),
    estatisticas: {
      expedicoes: e.expedicoes + mais(a.expedicoes, d.expedicoes),
      acertos: e.acertos + mais(a.acertos, d.acertos),
      contestacoes_vencidas:
        e.contestacoes_vencidas + mais(a.contestacoes_vencidas, d.contestacoes_vencidas),
    },
  };
}

/**
 * O resumo que vai ao site: o contador do Jogador e, de cada Aventura, só o id, a % e a Classe (as
 * mais recentes, se passar do limite). `null` se, por algum motivo, não passar na lista permitida.
 */
export function envioDoDesktop(
  jogador: ProgressoDoJogador,
  aventuras: readonly AventuraNoProjeto[],
): EnvioDeProgresso | null {
  const ordem = [...aventuras]
    .sort((a, b) => a.criada_em.localeCompare(b.criada_em))
    .slice(-MAXIMO_DE_AVENTURAS);
  const envio = montarEnvio({
    xp: jogador.xp,
    estatisticas: jogador.estatisticas,
    aventuras: ordem.map((aventura) => ({ id: aventura.id, aventura })),
  });
  const lido = lerEnvio(envio);
  return lido.ok ? lido.envio : null;
}

/** Um JSON de envio guardado, se ainda passar na lista permitida. */
function progressoDe(json: unknown): ProgressoDoJogador | null {
  try {
    const lido = lerEnvio(typeof json === 'string' ? JSON.parse(json) : json);
    return lido.ok ? { xp: lido.envio.xp, estatisticas: lido.envio.estatisticas } : null;
  } catch {
    return null;
  }
}

/** O estado do envio que a camada Rust devolveu, conferido campo a campo. */
function lerEstadoDoEnvio(dado: unknown): EstadoDoEnvio | null {
  if (typeof dado !== 'object' || dado === null) return null;
  const d = dado as Record<string, unknown>;
  const u = d.ultimo as Record<string, unknown> | null | undefined;
  const ultimo =
    u && typeof u.json === 'string' && typeof u.em === 'number' ? { json: u.json, em: u.em } : null;
  const pendente = typeof d.pendente === 'string' ? d.pendente : null;
  const servidor = lerEnvio(d.servidor);
  return { ultimo, pendente, servidor: servidor.ok ? servidor.envio : null };
}

const lerDoSistema = () => sistema.estadoDoEnvio().then(lerEstadoDoEnvio, () => null);

export type Sincronizacao = {
  /** O XP e as estatísticas do Jogador (o Título sai do XP). */
  jogador: ProgressoDoJogador;
  /** O que a tela "O que é enviado" mostra; null antes da primeira leitura. */
  envio: EstadoDoEnvio | null;
  /** O desfecho da última tentativa. */
  ultima: Sincronia['estado'] | 'erro' | null;
  /** As Aventuras lidas do disco ao abrir o Jogo. */
  carregadas: (aventuras: readonly AventuraNoProjeto[]) => void;
  /** Uma Aventura mudou: o ganho vai para o contador e, no fim de uma Expedição, sincroniza. */
  registrar: (aventura: AventuraNoProjeto) => void;
  sincronizar: () => void;
  /** Relê o estado do envio (ao abrir a tela). */
  reler: () => void;
};

/** A sincronia do Jogo desktop; `conectado` dispara uma tentativa quando o Jogador entra. */
export function useSincronia(conectado: boolean): Sincronizacao {
  const [jogador, setJogador] = useState(PROGRESSO_ZERADO);
  const [envio, setEnvio] = useState<EstadoDoEnvio | null>(null);
  const [ultima, setUltima] = useState<Sincronizacao['ultima']>(null);
  const estado = useRef({
    jogador: PROGRESSO_ZERADO,
    aventuras: new Map<string, AventuraNoProjeto>(),
    carregadas: false,
    // A base (pendente e último progresso do site) já foi lida?
    comBase: false,
    pendente: false,
    emCurso: false,
    deNovo: false,
  });

  const definir = useCallback((novo: ProgressoDoJogador) => {
    estado.current.jogador = novo;
    setJogador(novo);
  }, []);

  const aplicar = useCallback((lido: EstadoDoEnvio | null) => {
    if (lido) {
      estado.current.pendente = lido.pendente !== null;
      setEnvio(lido);
    }
    return lido;
  }, []);
  const reler = useCallback(() => lerDoSistema().then(aplicar), [aplicar]);

  const tentar = useRef<() => void>(() => {});
  const sincronizar = useCallback(() => tentar.current(), []);

  useEffect(() => {
    tentar.current = () => {
      const s = estado.current;
      if (!s.carregadas || !s.comBase) return;
      if (s.emCurso) {
        s.deNovo = true;
        return;
      }
      const corpo = envioDoDesktop(s.jogador, [...s.aventuras.values()]);
      if (!corpo) return;
      s.emCurso = true;
      void sistema
        .sincronizarProgresso(JSON.stringify(corpo))
        .then(
          (resposta) => {
            setUltima(resposta.estado);
            if (resposta.estado !== 'sincronizado') return;
            const doSite = progressoDe(resposta.progresso);
            if (doSite) definir(maior(s.jogador, doSite));
          },
          () => setUltima('erro'),
        )
        .then(reler)
        .finally(() => {
          s.emCurso = false;
          if (s.deNovo) {
            s.deNovo = false;
            tentar.current();
          }
        });
    };
  }, [definir, reler]);

  // Ao abrir: a base do contador vem do pendente e do último progresso do site.
  useEffect(() => {
    let vivo = true;
    void lerDoSistema().then((lido) => {
      if (!vivo) return;
      aplicar(lido);
      const s = estado.current;
      const base = [progressoDe(lido?.pendente ?? null), progressoDe(lido?.servidor ?? null)];
      definir(base.reduce<ProgressoDoJogador>((j, b) => (b ? maior(j, b) : j), s.jogador));
      s.comBase = true;
      tentar.current();
    });
    return () => {
      vivo = false;
    };
  }, [aplicar, definir]);

  // A cada 5 minutos, se ainda há envio pendente.
  useEffect(() => {
    const id = setInterval(() => {
      if (estado.current.pendente) tentar.current();
    }, INTERVALO_DA_SINCRONIA);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (conectado) tentar.current();
  }, [conectado]);

  const carregadas = useCallback(
    (aventuras: readonly AventuraNoProjeto[]) => {
      const s = estado.current;
      // Uma Aventura criada antes da leitura terminar continua valendo.
      for (const a of aventuras) if (!s.aventuras.has(a.id)) s.aventuras.set(a.id, a);
      definir(maior(s.jogador, somaDasAventuras([...s.aventuras.values()])));
      s.carregadas = true;
      tentar.current();
    },
    [definir],
  );

  const registrar = useCallback(
    (aventura: AventuraNoProjeto) => {
      const s = estado.current;
      const antes = s.aventuras.get(aventura.id) ?? PROGRESSO_ZERADO;
      s.aventuras.set(aventura.id, aventura);
      definir(somarDiferenca(s.jogador, antes, aventura));
      if (aventura.estatisticas.expedicoes > antes.estatisticas.expedicoes) tentar.current();
    },
    [definir],
  );

  return {
    jogador,
    envio,
    ultima,
    carregadas,
    registrar,
    sincronizar,
    reler: useCallback(() => void reler(), [reler]),
  };
}
