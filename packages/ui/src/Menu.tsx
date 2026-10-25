'use client';
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type ItemMenu = { id: string; rotulo: ReactNode; desabilitado?: boolean };

type MenuProps = {
  /** Nome acessível do menu. */
  rotulo: string;
  itens: readonly ItemMenu[];
  onEscolher: (id: string) => void;
  /** Itens lado a lado: ← → movem o cursor (↑ ↓ continuam valendo). */
  horizontal?: boolean;
  /** O item sob o cursor recebe o foco ao aparecer, para o teclado já funcionar. */
  autoFoco?: boolean;
  className?: string;
};

/** Menu de JRPG: cursor ▶, ↑ ↓ movem, Enter escolhe; o mouse faz o mesmo (spec §13). */
export function Menu({
  rotulo,
  itens,
  onEscolher,
  horizontal = false,
  autoFoco = false,
  className,
}: MenuProps) {
  const [cursor, setCursor] = useState(0);
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  // Se o item sob o cursor sumiu ou foi desabilitado, o cursor vai para o primeiro disponível.
  const disponivel = (k: number) => itens[k] !== undefined && !itens[k].desabilitado;
  const atual = disponivel(cursor)
    ? cursor
    : Math.max(
        0,
        itens.findIndex((i) => !i.desabilitado),
      );

  function mover(passo: 1 | -1) {
    let proximo = atual;
    for (let n = 0; n < itens.length; n++) {
      proximo = (proximo + passo + itens.length) % itens.length;
      if (disponivel(proximo)) break;
    }
    setCursor(proximo);
    botoes.current[proximo]?.focus();
  }

  function aoTeclar(evento: KeyboardEvent) {
    const proximo = horizontal ? ['ArrowDown', 'ArrowRight'] : ['ArrowDown'];
    const anterior = horizontal ? ['ArrowUp', 'ArrowLeft'] : ['ArrowUp'];
    if (proximo.includes(evento.key)) mover(1);
    else if (anterior.includes(evento.key)) mover(-1);
    else return;
    evento.preventDefault();
  }

  return (
    <div
      className={['menu', horizontal && 'menu--horizontal', className].filter(Boolean).join(' ')}
      role="menu"
      aria-label={rotulo}
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      onKeyDown={aoTeclar}
    >
      {itens.map((item, k) => (
        <button
          key={item.id}
          ref={(el) => {
            botoes.current[k] = el;
          }}
          type="button"
          role="menuitem"
          className="menu-item"
          data-cursor={k === atual}
          tabIndex={k === atual ? 0 : -1}
          autoFocus={autoFoco && k === atual}
          disabled={item.desabilitado}
          onMouseEnter={() => disponivel(k) && setCursor(k)}
          onFocus={() => setCursor(k)}
          onClick={() => onEscolher(item.id)}
        >
          {item.rotulo}
        </button>
      ))}
    </div>
  );
}
