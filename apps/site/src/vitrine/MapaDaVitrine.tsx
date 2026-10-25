'use client';
import { useMemo, useState } from 'react';
import type { EstadoNoMapa } from '@quiz/jogo';
import type { Idioma } from '@quiz/i18n';
import { mapaNoIdioma } from '@quiz/taverna';
import {
  LegendaMapa,
  MapaMundi,
  useIdioma,
  useMensagens,
  type IlhaNoMapa,
  type LigacaoNoMapa,
  type RegiaoNoMapa,
} from '@quiz/ui';
import { COLUNAS, CONSTRUCOES, ILHAS, LINHAS } from '@/tutorial/disposicao';

// Um retrato fixo do mapa, como o de um Bardo Fullstack depois da primeira vitória: a entrada
// revelada, as vizinhas desbloqueadas, o resto na Névoa (sem spoiler das outras Regiões).
const REVELADA = 'carrinho-checkout';

function retrato(idioma: Idioma) {
  const { territorios, regioes, ligacoes } = mapaNoIdioma(idioma);
  const ilhas: IlhaNoMapa[] = territorios.flatMap((t) => {
    const ilha = ILHAS[t.id];
    return ilha ? [{ id: t.id, nome: t.nome, ...ilha }] : [];
  });
  const conhecidas: LigacaoNoMapa[] = ligacoes
    .filter((l) => l.origem.regiao_id === REVELADA || l.destino.regiao_id === REVELADA)
    .map((l) => ({
      id: l.id,
      origem: l.origem.regiao_id,
      destino: l.destino.regiao_id,
      tipo: l.tipo,
      descricao: l.descricao,
    }));
  const vizinhas = new Set(conhecidas.flatMap((l) => [l.origem, l.destino]));
  const noMapa: RegiaoNoMapa[] = regioes.flatMap((r) => {
    const construcao = CONSTRUCOES[r.id];
    const estado: EstadoNoMapa =
      r.id === REVELADA ? 'revelada' : vizinhas.has(r.id) ? 'desbloqueada' : 'nevoa';
    return construcao ? [{ id: r.id, nome: r.nome, estado, ...construcao }] : [];
  });
  return { ilhas, ligacoes: conhecidas, regioes: noMapa, resumos: regioes };
}

type Props = {
  rotulo: string;
  /** Sem isto, só o mapa (a inicial); com isto, o painel da região escolhida embaixo. */
  ajuda?: string;
};

/** O mapa-mundi da Taverna só para ver: escolher uma região mostra o que ela faz, nada mais. */
export function MapaDaVitrine({ rotulo, ajuda }: Props) {
  const idioma = useIdioma();
  const estados = useMensagens().jogo.estados;
  const { ilhas, ligacoes, regioes, resumos } = useMemo(() => retrato(idioma), [idioma]);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const regiao = resumos.find((r) => r.id === selecionada);
  const estado = regioes.find((r) => r.id === selecionada)?.estado;
  return (
    <>
      <MapaMundi
        colunas={COLUNAS}
        linhas={LINHAS}
        ilhas={ilhas}
        regioes={regioes}
        ligacoes={ligacoes}
        selecionada={selecionada}
        onSelecionar={setSelecionada}
        heroi={REVELADA}
        spriteHeroi="bardo"
        rotulo={rotulo}
      />
      {ajuda !== undefined && (
        <div aria-live="polite">
          <LegendaMapa />
          {regiao && estado ? (
            <p>
              <strong>{regiao.nome}</strong> · {estados[estado]} — {regiao.resumo}
            </p>
          ) : (
            <p className="texto-apagado">{ajuda}</p>
          )}
        </div>
      )}
    </>
  );
}
