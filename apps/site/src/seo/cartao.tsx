// A imagem de compartilhamento (Open Graph/Twitter) de cada página pública, no estilo pixel: a
// janela azul de borda branca, o título em Press Start 2P e o lema em VT323.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { LEMA } from './site';

export const TAMANHO_DO_CARTAO = { width: 1200, height: 630 };

// Os .woff do @fontsource (o satori não lê woff2). As imagens são geradas no build, então a leitura
// acontece na pasta da app; lidas uma vez por processo.
let fontes: Promise<[Buffer, Buffer]> | undefined;
const pastaFontes = (pacote: string) =>
  path.join(process.cwd(), 'node_modules', '@fontsource', pacote, 'files');
const carregarFontes = () =>
  (fontes ??= Promise.all([
    readFile(path.join(pastaFontes('press-start-2p'), 'press-start-2p-latin-400-normal.woff')),
    readFile(path.join(pastaFontes('vt323'), 'vt323-latin-400-normal.woff')),
  ]));

const COR = {
  fundo: '#10101c',
  texto: '#f4f0e8',
  apagado: '#9aa0b0',
  ouro: '#f1c40f',
  sombra: '#8a5a00',
  topo: '#2b3a8f',
  base: '#141b4d',
  contorno: '#6b74c9',
};

/** O cartão: a marca no topo, o texto da página no meio e o lema embaixo. */
export async function cartao(texto: string): Promise<ImageResponse> {
  const [pressStart, vt323] = await carregarFontes();
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: 40,
        background: COR.fundo,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          background: `linear-gradient(${COR.topo}, ${COR.base})`,
          border: `8px solid ${COR.texto}`,
          boxShadow: `0 0 0 8px ${COR.fundo}, 0 0 0 12px ${COR.contorno}`,
          color: COR.texto,
        }}
      >
        <div
          style={{ fontFamily: 'Press Start 2P', fontSize: 34, color: COR.ouro, display: 'flex' }}
        >
          QUIZ YOUR SLOP
        </div>
        <div
          style={{
            fontFamily: 'Press Start 2P',
            fontSize: 50,
            lineHeight: 1.5,
            textShadow: `6px 6px 0 ${COR.sombra}`,
            display: 'flex',
          }}
        >
          {texto}
        </div>
        <div
          style={{
            fontFamily: 'VT323',
            fontSize: 44,
            color: COR.apagado,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* O cursor ▶ desenhado: o caractere viraria emoji no satori. */}
          <svg width="24" height="28" viewBox="0 0 24 28">
            <polygon points="0,0 24,14 0,28" fill={COR.ouro} />
          </svg>
          {LEMA}
        </div>
      </div>
    </div>,
    {
      ...TAMANHO_DO_CARTAO,
      fonts: [
        { name: 'Press Start 2P', data: pressStart, weight: 400, style: 'normal' },
        { name: 'VT323', data: vt323, weight: 400, style: 'normal' },
      ],
    },
  );
}
