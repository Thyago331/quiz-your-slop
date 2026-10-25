'use client';
import { useState, type ReactNode } from 'react';
import { Menu } from './Menu.tsx';

export type PassoOrdenavel = { id: string; rotulo: ReactNode; naNevoa?: boolean };

type OrdemDoFluxoProps = {
  /** Na ordem em que aparecem para escolher (a do Desafio, que não é a certa). */
  passos: readonly PassoOrdenavel[];
  onConfirmar: (ordem: string[]) => void;
};

/**
 * Traçar o fluxo: o Jogador tira os passos do monte na ordem que acha certa (↑ ↓ Enter ou clique),
 * pode recomeçar a ordem e confirma quando todos estão no lugar.
 */
export function OrdemDoFluxo({ passos, onConfirmar }: OrdemDoFluxoProps) {
  const [ordem, setOrdem] = useState<string[]>([]);
  const monte = passos.filter((p) => !ordem.includes(p.id));
  const completa = monte.length === 0;
  const passo = (id: string) => passos.find((p) => p.id === id);

  return (
    <div className="fluxo">
      <div className="texto-apagado">Ordem escolhida:</div>
      {ordem.length === 0 ? (
        <p className="fluxo-vazia texto-apagado">(vazia)</p>
      ) : (
        <ol className="fluxo-ordem" aria-label="Ordem escolhida">
          {ordem.map((id) => (
            <li key={id} className={passo(id)?.naNevoa ? 'passo--nevoa' : undefined}>
              {passo(id)?.rotulo}
            </li>
          ))}
        </ol>
      )}

      {!completa && (
        <>
          <div className="texto-apagado">Escolha o {ordem.length + 1}º passo:</div>
          <Menu
            // Remontar a cada escolha devolve o foco ao monte (o botão escolhido some).
            key={`monte-${ordem.length}`}
            rotulo="Passos que faltam"
            autoFoco
            className="fluxo-monte"
            itens={monte.map((p) => ({
              id: p.id,
              rotulo: <span className={p.naNevoa ? 'passo--nevoa' : undefined}>{p.rotulo}</span>,
            }))}
            onEscolher={(id) => setOrdem([...ordem, id])}
          />
        </>
      )}

      <Menu
        key={completa ? 'acoes-completa' : 'acoes'}
        rotulo="Ordem"
        autoFoco={completa}
        horizontal
        className="fluxo-acoes"
        itens={[
          { id: 'confirmar', rotulo: '⚔ ATACAR (confirmar a ordem)', desabilitado: !completa },
          { id: 'recomecar', rotulo: '↺ Recomeçar a ordem', desabilitado: ordem.length === 0 },
        ]}
        onEscolher={(id) => {
          if (id === 'recomecar') setOrdem([]);
          else if (completa) onConfirmar(ordem);
        }}
      />
    </div>
  );
}
