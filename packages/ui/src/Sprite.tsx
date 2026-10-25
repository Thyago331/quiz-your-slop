import { PALETA, SPRITES, type NomeSprite } from './sprites.ts';

type PixelsProps = { nome: NomeSprite; x?: number; y?: number; escala?: number };

/** Os pixels de um sprite, para desenhar dentro de um <svg> (o mapa usa assim). */
export function Pixels({ nome, x = 0, y = 0, escala = 1 }: PixelsProps) {
  const linhas = SPRITES[nome];
  return (
    <g>
      {linhas.flatMap((linha, j) =>
        [...linha].map((letra, i) => {
          const cor = PALETA[letra];
          if (!cor) return null;
          return (
            <rect
              key={`${i}-${j}`}
              x={x + i * escala}
              y={y + j * escala}
              width={escala}
              height={escala}
              fill={cor}
            />
          );
        }),
      )}
    </g>
  );
}

type SpriteProps = { nome: NomeSprite; escala?: number; titulo?: string };

/** Um sprite solto na página; sem título, é decorativo. */
export function Sprite({ nome, escala = 8, titulo }: SpriteProps) {
  const linhas = SPRITES[nome];
  const largura = linhas[0]?.length ?? 0;
  return (
    <svg
      className="sprite"
      viewBox={`0 0 ${largura} ${linhas.length}`}
      width={largura * escala}
      height={linhas.length * escala}
      shapeRendering="crispEdges"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <Pixels nome={nome} />
    </svg>
  );
}
