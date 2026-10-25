import { useState } from 'react';
import { IAS_DO_MESTRE, trocarMestre, type AventuraNoProjeto, type IaDoMestre } from '@quiz/jogo';
import { emMaiusculas, formatar } from '@quiz/i18n';
import { Janela, useIdioma, useMensagens } from '@quiz/ui';
import { EscolhaDoMestre, estaPronta, primeiraPronta, useMestres } from './EscolhaDoMestre.tsx';
import { useEsc } from './TelaProvisoria.tsx';

type TrocaDeMestreProps = {
  aventura: AventuraNoProjeto;
  /** A Aventura com o novo Mestre (o resto igual), para ir ao disco. */
  onTrocada: (aventura: AventuraNoProjeto) => void;
  onVoltar: () => void;
};

/**
 * Trocar o Mestre de uma Aventura existente (spec §7): só as IAs detectadas e prontas, com o aviso
 * "O Mestre só pode LER" e o comando exato. A memória fica no Jogo; só o campo `mestre` muda.
 */
export function TrocaDeMestre({ aventura, onTrocada, onVoltar }: TrocaDeMestreProps) {
  const idioma = useIdioma();
  const m = useMensagens();
  const t = m.ui.aventura.troca;
  const nomes = m.ui.nova.mestre;
  useEsc(onVoltar);
  const mestres = useMestres(aventura.repositorios.map((r) => r.caminho_local));
  const [ia, setIa] = useState<IaDoMestre | null>(null);
  // O cursor começa na outra IA, se ela estiver pronta.
  const outras = IAS_DO_MESTRE.filter((x) => x !== aventura.mestre);
  const escolhida =
    ia && estaPronta(mestres, ia)
      ? ia
      : (primeiraPronta(mestres, [...outras, aventura.mestre]) ?? null);
  const muda = escolhida !== null && escolhida !== aventura.mestre;

  return (
    <main className="nova-aventura">
      <Janela titulo={emMaiusculas(idioma, t.titulo)} className="nova-janela">
        <p>{formatar(t.atual, { mestre: nomes[aventura.mestre] })}</p>
        <p className="nova-apagado">{t.memoria}</p>
        <EscolhaDoMestre
          mestres={mestres}
          escolhida={escolhida}
          onEscolhida={setIa}
          atual={aventura.mestre}
          rotulo={t.titulo}
          acoes={[
            {
              id: 'confirmar',
              rotulo: formatar(t.confirmar, { mestre: escolhida ? nomes[escolhida] : '—' }),
              desabilitado: !muda,
            },
            { id: 'voltar', rotulo: t.voltar },
          ]}
          onAcao={(id) => {
            if (id === 'voltar') onVoltar();
            else if (muda) onTrocada(trocarMestre(aventura, escolhida, new Date().toISOString()));
          }}
        />
        <p className="nova-ajuda">{m.ui.nova.ajuda}</p>
      </Janela>
    </main>
  );
}
