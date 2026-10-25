'use client';
import { useRef, type KeyboardEvent } from 'react';
import type { EstadoNoMapa, TipoLigacao } from '@quiz/jogo';
import { Pixels } from './Sprite.tsx';
import type { NomeSprite } from './sprites.ts';

/** Lado de um tile, em unidades do SVG. */
const T = 24;

export const ROTULO_LIGACAO: Readonly<Record<TipoLigacao, string>> = {
  chamada: 'Chamada',
  consulta: 'Consulta',
  evento: 'Evento',
  dependencia: 'Dependência',
};

export const ROTULO_ESTADO: Readonly<Record<EstadoNoMapa, string>> = {
  nevoa: 'na Névoa',
  desbloqueada: 'desbloqueada',
  revelada: 'revelada',
  desatualizada: 'desatualizada',
};

const MARCA_ESTADO: Readonly<Record<EstadoNoMapa, string>> = {
  nevoa: '',
  desbloqueada: '',
  revelada: ' ★',
  desatualizada: ' ⟳',
};

/** Território = ilha: um retângulo de tiles. */
export type IlhaNoMapa = {
  id: string;
  nome: string;
  coluna: number;
  linha: number;
  largura: number;
  altura: number;
};

/** Região = construção num tile; o sprite e a posição vêm de quem monta o mapa. */
export type RegiaoNoMapa = {
  id: string;
  nome: string;
  estado: EstadoNoMapa;
  coluna: number;
  linha: number;
  sprite: NomeSprite;
};

/** Ligação = estrada. Quem monta o mapa passa só as conhecidas. */
export type LigacaoNoMapa = {
  id: string;
  origem: string;
  destino: string;
  tipo: TipoLigacao;
  descricao: string;
};

export type MapaMundiProps = {
  colunas: number;
  linhas: number;
  ilhas: readonly IlhaNoMapa[];
  regioes: readonly RegiaoNoMapa[];
  ligacoes: readonly LigacaoNoMapa[];
  selecionada: string | null;
  onSelecionar: (regiaoId: string) => void;
  /** Região onde o herói está. */
  heroi?: string;
  /** O sprite do herói (o da Classe, por exemplo). */
  spriteHeroi?: NomeSprite;
  rotulo?: string;
};

type Tile = readonly [number, number];

// Ruído fixo para enfeitar grama e água sem mudar a cada render.
const ruido = (i: number, j: number) => Math.abs((i * 73856093) ^ (j * 19349663)) % 7;

/** Os dois jeitos de ligar dois tiles em L: horizontal e depois vertical, ou o contrário. */
function caminhosEmL(a: Tile, b: Tile): Tile[][] {
  const reta = (de: Tile, ate: Tile): Tile[] => {
    const [di, dj] = [Math.sign(ate[0] - de[0]), Math.sign(ate[1] - de[1])];
    const tiles: Tile[] = [de];
    let [i, j] = de;
    while (i !== ate[0] || j !== ate[1]) {
      i += di;
      j += dj;
      tiles.push([i, j]);
    }
    return tiles;
  };
  const horizontalPrimeiro = [...reta(a, [b[0], a[1]]), ...reta([b[0], a[1]], b).slice(1)];
  const verticalPrimeiro = [...reta(a, [a[0], b[1]]), ...reta([a[0], b[1]], b).slice(1)];
  return [horizontalPrimeiro, verticalPrimeiro];
}

type Caixa = readonly [x: number, y: number, largura: number, altura: number];

const encostam = (a: Caixa, b: Caixa) =>
  a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

/** Onde a construção e o nome de uma região ocupam o desenho. */
function caixasDaRegiao(r: RegiaoNoMapa): Caixa[] {
  const x = r.coluna * T - 12;
  const y = r.linha * T - 12;
  const larguraNome = (r.nome.length + 2) * 9;
  return [
    [x - 6, y - 6, 60, 60],
    [x + 24 - larguraNome / 2, y + 58, larguraNome, 20],
  ];
}

/**
 * Traça as estradas evitando passar por construções que não são as das pontas e, se der,
 * por outras estradas; depois acha para cada rótulo um lugar livre ao longo da própria estrada.
 */
function tracarEstradas(regioes: readonly RegiaoNoMapa[], ligacoes: readonly LigacaoNoMapa[]) {
  const porId = new Map(regioes.map((r) => [r.id, r]));
  const ocupados = new Set<string>();
  const ocupadas: Caixa[] = regioes.flatMap(caixasDaRegiao);
  const caixaDoTile = ([i, j]: Tile): Caixa => [i * T + 6, j * T + 6, 12, 12];

  return ligacoes.flatMap((ligacao) => {
    const a = porId.get(ligacao.origem);
    const b = porId.get(ligacao.destino);
    if (!a || !b) return [];
    const obstaculos = regioes
      .filter((r) => r.id !== a.id && r.id !== b.id)
      .flatMap(caixasDaRegiao);
    const custo = (tiles: Tile[]) =>
      tiles.reduce(
        (soma, t) =>
          soma +
          (obstaculos.some((o) => encostam(o, caixaDoTile(t))) ? 10 : 0) +
          (ocupados.has(`${t[0]},${t[1]}`) ? 1 : 0),
        0,
      );
    const opcoes = caminhosEmL([a.coluna, a.linha], [b.coluna, b.linha]);
    const tiles = opcoes.reduce((melhor, opcao) => (custo(opcao) < custo(melhor) ? opcao : melhor));
    for (const [i, j] of tiles) ocupados.add(`${i},${j}`);

    const texto = ROTULO_LIGACAO[ligacao.tipo];
    const largura = texto.length * 9 + 6;
    const meio = Math.floor(tiles.length / 2);
    const candidatos = tiles
      .map((t, k) => ({ t, distancia: Math.abs(k - meio) }))
      .sort((x, y) => x.distancia - y.distancia)
      .flatMap(({ t: [i, j] }) => [
        [i * T + 12, j * T + 2],
        [i * T + 12, j * T + 34],
      ]);
    const caixaDoRotulo = ([x, y]: number[]): Caixa => [x! - largura / 2, y! - 14, largura, 17];
    const lugar = candidatos.find((c) => !ocupadas.some((o) => encostam(o, caixaDoRotulo(c)))) ??
      candidatos[0] ?? [0, 0];
    ocupadas.push(caixaDoRotulo(lugar));
    return [{ ligacao, tiles, rotulo: [lugar[0] ?? 0, lugar[1] ?? 0] as Tile }];
  });
}

/** Próxima região na direção da seta: a mais perto no eixo, penalizando o desvio lateral. */
function vizinhaNaDirecao(
  regioes: readonly RegiaoNoMapa[],
  atual: RegiaoNoMapa,
  [di, dj]: Tile,
): RegiaoNoMapa | undefined {
  let melhor: RegiaoNoMapa | undefined;
  let menor = Infinity;
  for (const r of regioes) {
    const dx = r.coluna - atual.coluna;
    const dy = r.linha - atual.linha;
    const frente = dx * di + dy * dj;
    if (r.id === atual.id || frente <= 0) continue;
    const custo = frente + 2 * Math.abs(dx * dj + dy * di);
    if (custo < menor) [melhor, menor] = [r, custo];
  }
  return melhor;
}

const DIRECOES: Readonly<Record<string, Tile>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** O mapa-mundi em tiles da variante D (spec §13): ilhas, construções, estradas e Névoa. */
export function MapaMundi({
  colunas,
  linhas,
  ilhas,
  regioes,
  ligacoes,
  selecionada,
  onSelecionar,
  heroi,
  spriteHeroi = 'heroi',
  rotulo = 'Mapa-mundi',
}: MapaMundiProps) {
  const botoes = useRef(new Map<string, HTMLButtonElement>());
  const largura = colunas * T;
  const altura = linhas * T;
  const posicao = new Map(regioes.map((r) => [r.id, [r.coluna, r.linha] as Tile]));
  const ehTerra = (i: number, j: number) =>
    ilhas.some(
      (l) => i >= l.coluna && i < l.coluna + l.largura && j >= l.linha && j < l.linha + l.altura,
    );

  const conhecidas = regioes.filter((r) => r.estado !== 'nevoa');
  const comFoco = conhecidas.find((r) => r.id === selecionada) ?? conhecidas[0];

  function aoTeclar(evento: KeyboardEvent, regiao: RegiaoNoMapa) {
    const direcao = DIRECOES[evento.key];
    if (!direcao) return;
    evento.preventDefault();
    const proxima = vizinhaNaDirecao(conhecidas, regiao, direcao);
    if (!proxima) return;
    onSelecionar(proxima.id);
    botoes.current.get(proxima.id)?.focus();
  }

  const enfeites: Tile[] = [];
  for (let j = 0; j < linhas; j++)
    for (let i = 0; i < colunas; i++) if (ruido(i, j) < 2) enfeites.push([i, j]);

  const estradas = tracarEstradas(regioes, ligacoes);

  return (
    <div className="mapa">
      <svg
        viewBox={`0 0 ${largura} ${altura}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={rotulo}
      >
        <rect width={largura} height={altura} className="mapa-agua" />
        {enfeites
          .filter(([i, j]) => !ehTerra(i, j))
          .map(([i, j]) => (
            <rect
              key={`o${i}-${j}`}
              x={i * T + 4}
              y={j * T + 10}
              width={9}
              height={3}
              className="mapa-onda"
            />
          ))}
        {ilhas.map((l) => (
          <rect
            key={l.id}
            x={l.coluna * T}
            y={l.linha * T}
            width={l.largura * T}
            height={l.altura * T}
            className="mapa-terra"
          />
        ))}
        {enfeites
          .filter(([i, j]) => ehTerra(i, j) && ruido(i, j) === 0)
          .map(([i, j]) => (
            <g key={`g${i}-${j}`} className="mapa-grama">
              <rect x={i * T + 6} y={j * T + 9} width={3} height={3} />
              <rect x={i * T + 15} y={j * T + 15} width={3} height={3} />
            </g>
          ))}

        {estradas.map(({ ligacao, tiles }) => (
          <g key={ligacao.id} className={`mapa-estrada mapa-estrada--${ligacao.tipo}`}>
            <title>{`${ROTULO_LIGACAO[ligacao.tipo]}: ${ligacao.descricao}`}</title>
            {tiles.map(([i, j]) =>
              ehTerra(i, j) ? (
                <rect
                  key={`${i}-${j}`}
                  x={i * T + 6}
                  y={j * T + 6}
                  width={12}
                  height={12}
                  className="mapa-chao"
                />
              ) : (
                <g key={`${i}-${j}`} className="mapa-ponte">
                  <rect x={i * T + 6} y={j * T + 6} width={12} height={12} />
                  <rect
                    x={i * T + 6}
                    y={j * T + 11}
                    width={12}
                    height={2}
                    className="mapa-ponte-tabua"
                  />
                </g>
              ),
            )}
          </g>
        ))}

        {ilhas.map((l) => (
          <text key={l.id} x={l.coluna * T + 8} y={l.linha * T + 14} className="mapa-territorio">
            {l.nome.toUpperCase()}
          </text>
        ))}

        {regioes.map((r) => {
          const x = r.coluna * T - 12;
          const y = r.linha * T - 12;
          if (r.estado === 'nevoa') {
            const nuvem: Tile[] = [];
            for (let q = 0; q < 18; q++)
              for (let w = 0; w < 18; w++) if ((q + w) % 2 === 0) nuvem.push([q, w]);
            return (
              <g key={r.id} className="mapa-nevoa">
                {nuvem.map(([q, w]) => (
                  <rect
                    key={`${q}-${w}`}
                    x={(r.coluna - 1) * T + q * 4}
                    y={(r.linha - 1) * T + w * 4}
                    width={4}
                    height={4}
                  />
                ))}
                <text x={r.coluna * T + 12} y={r.linha * T + 18} className="mapa-nevoa-texto">
                  ???
                </text>
              </g>
            );
          }
          return (
            <g
              key={r.id}
              className={`mapa-regiao mapa-regiao--${r.estado}${r.id === selecionada ? ' mapa-regiao--selecionada' : ''}`}
            >
              <rect x={x - 4} y={y - 4} width={56} height={56} className="mapa-moldura" />
              <Pixels nome={r.sprite} x={x} y={y} escala={6} />
              <text x={x + 24} y={y + 74} className="mapa-nome">
                {r.nome + MARCA_ESTADO[r.estado]}
              </text>
              {r.id === selecionada && (
                <text x={x - 10} y={y + 30} className="mapa-cursor">
                  ▶
                </text>
              )}
            </g>
          );
        })}

        {estradas.map(({ ligacao, rotulo: [lx, ly] }) => (
          <text
            key={ligacao.id}
            x={lx}
            y={ly}
            className={`mapa-rotulo mapa-rotulo--${ligacao.tipo}`}
          >
            {ROTULO_LIGACAO[ligacao.tipo]}
          </text>
        ))}

        {heroi && posicao.has(heroi) && (
          <Pixels
            nome={spriteHeroi}
            x={(posicao.get(heroi)?.[0] ?? 0) * T + 30}
            y={(posicao.get(heroi)?.[1] ?? 0) * T + 6}
            escala={3}
          />
        )}
      </svg>

      {/* Os alvos acessíveis ficam por cima do desenho, nas mesmas posições. */}
      {conhecidas.map((r) => (
        <button
          key={r.id}
          ref={(el) => {
            if (el) botoes.current.set(r.id, el);
            else botoes.current.delete(r.id);
          }}
          type="button"
          className="mapa-alvo"
          style={{
            left: `${((r.coluna * T - 16) / largura) * 100}%`,
            top: `${((r.linha * T - 16) / altura) * 100}%`,
            width: `${(56 / largura) * 100}%`,
            height: `${(80 / altura) * 100}%`,
          }}
          aria-label={`${r.nome}, ${ROTULO_ESTADO[r.estado]}`}
          aria-pressed={r.id === selecionada}
          tabIndex={r.id === comFoco?.id ? 0 : -1}
          onClick={() => onSelecionar(r.id)}
          onKeyDown={(e) => aoTeclar(e, r)}
        />
      ))}
    </div>
  );
}

/** A legenda dos estados, como no rodapé do protótipo. */
export function LegendaMapa() {
  return (
    <p className="legenda">
      <span className="legenda-revelada">★ revelada</span> ·{' '}
      <span className="legenda-desbloqueada">⬚ desbloqueada</span> ·{' '}
      <span className="legenda-desatualizada">⟳ desatualizada</span> ·{' '}
      <span className="legenda-nevoa">☁ Névoa</span>
    </p>
  );
}
