'use client';
// O explorador de código do Tutorial (spec §9): a árvore da Taverna com a Névoa da Aventura.
import { useMemo, useState, type ComponentProps } from 'react';
import { arvoreDoExplorador, type MapaAventura } from '@quiz/jogo';
import { ARQUIVOS, REGIOES, TERRITORIOS } from '@quiz/taverna';
import { Batalha, ExploradorDeCodigo, PalcoComCodigo, type ArquivoAberto } from '@quiz/ui';

const TODOS = Object.keys(ARQUIVOS);
const lerArquivo = (caminho: string) => ARQUIVOS[caminho];

function useArvore(estados: MapaAventura['estados']) {
  return useMemo(
    () => arvoreDoExplorador({ territorios: TERRITORIOS, regioes: REGIOES, estados, todos: TODOS }),
    [estados],
  );
}

/** No mapa: ler o código das regiões já fora da Névoa antes de partir. */
export function ExploradorDaTaverna({ estados }: { estados: MapaAventura['estados'] }) {
  const grupos = useArvore(estados);
  const [aberto, setAberto] = useState<ArquivoAberto | null>(null);
  return (
    <ExploradorDeCodigo
      grupos={grupos}
      lerArquivo={lerArquivo}
      aberto={aberto}
      onAbrir={(caminho) => setAberto({ caminho })}
    />
  );
}

/**
 * A batalha com o explorador ao lado; começa num arquivo-semente da região em disputa, e cada
 * Evidência abre o arquivo dela nas linhas certas.
 */
export function BatalhaComExplorador(props: ComponentProps<typeof Batalha>) {
  const { expedicao, estados } = props;
  const grupos = useArvore(estados);
  const semente = REGIOES.find((r) => r.id === expedicao.regiaoId)?.arquivos_semente[0];
  const [aberto, setAberto] = useState<ArquivoAberto | null>(semente ? { caminho: semente } : null);
  const [aba, setAba] = useState<'principal' | 'codigo'>('principal');
  return (
    <PalcoComCodigo
      aba={aba}
      onTrocarAba={setAba}
      codigo={
        <ExploradorDeCodigo
          grupos={grupos}
          lerArquivo={lerArquivo}
          aberto={aberto}
          onAbrir={(caminho) => setAberto({ caminho })}
        />
      }
      principal={
        <Batalha
          {...props}
          onAbrirEvidencia={(ev) => {
            setAberto({ caminho: ev.caminho, inicio: ev.linha_inicio, fim: ev.linha_fim });
            setAba('codigo');
          }}
        />
      }
    />
  );
}
