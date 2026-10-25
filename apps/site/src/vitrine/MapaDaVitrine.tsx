'use client';
import { useState } from 'react';
import { LIGACOES, REGIOES, TERRITORIOS } from '@quiz/taverna';
import {
  LegendaMapa,
  MapaMundi,
  ROTULO_ESTADO,
  type IlhaNoMapa,
  type LigacaoNoMapa,
  type RegiaoNoMapa,
} from '@quiz/ui';
import type { EstadoNoMapa } from '@quiz/jogo';
import { COLUNAS, CONSTRUCOES, ILHAS, LINHAS } from '@/tutorial/disposicao';

// Um retrato fixo do mapa, como o de um Bardo Fullstack depois da primeira vitória: a entrada
// revelada, as vizinhas desbloqueadas, o resto na Névoa (sem spoiler das outras Regiões).
const REVELADA = 'carrinho-checkout';

const ilhas: IlhaNoMapa[] = TERRITORIOS.flatMap((t) => {
  const ilha = ILHAS[t.id];
  return ilha ? [{ id: t.id, nome: t.nome, ...ilha }] : [];
});

const ligacoes: LigacaoNoMapa[] = LIGACOES.filter(
  (l) => l.origem.regiao_id === REVELADA || l.destino.regiao_id === REVELADA,
).map((l) => ({
  id: l.id,
  origem: l.origem.regiao_id,
  destino: l.destino.regiao_id,
  tipo: l.tipo,
  descricao: l.descricao,
}));

const vizinhas = new Set(ligacoes.flatMap((l) => [l.origem, l.destino]));

const regioes: RegiaoNoMapa[] = REGIOES.flatMap((r) => {
  const construcao = CONSTRUCOES[r.id];
  const estado: EstadoNoMapa =
    r.id === REVELADA ? 'revelada' : vizinhas.has(r.id) ? 'desbloqueada' : 'nevoa';
  return construcao ? [{ id: r.id, nome: r.nome, estado, ...construcao }] : [];
});

type Props = {
  rotulo: string;
  /** Sem isto, só o mapa (a inicial); com isto, o painel da região escolhida embaixo. */
  ajuda?: string;
};

/** O mapa-mundi da Taverna só para ver: escolher uma região mostra o que ela faz, nada mais. */
export function MapaDaVitrine({ rotulo, ajuda }: Props) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const regiao = REGIOES.find((r) => r.id === selecionada);
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
              <strong>{regiao.nome}</strong> · {ROTULO_ESTADO[estado]} — {regiao.resumo}
            </p>
          ) : (
            <p className="texto-apagado">{ajuda}</p>
          )}
        </div>
      )}
    </>
  );
}
