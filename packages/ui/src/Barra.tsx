type BarraProps = { valor: number; maximo: number; rotulo: string; tipo?: 'ouro' | 'vida' };

/** Barra de blocos do HUD (XP, vida do Guardião, Progresso). */
export function Barra({ valor, maximo, rotulo, tipo = 'ouro' }: BarraProps) {
  return (
    <span
      className={`barra barra--${tipo}`}
      role="meter"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-valuenow={valor}
    >
      {Array.from({ length: maximo }, (_, k) => (
        <i key={k} className={k < valor ? 'cheio' : undefined} />
      ))}
    </span>
  );
}
