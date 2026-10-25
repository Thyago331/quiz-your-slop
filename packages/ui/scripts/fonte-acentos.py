"""Gera a fonte "Quiz Pixel Acentos": só as maiúsculas acentuadas, redesenhadas a partir da Press
Start 2P (OFL), cujo subconjunto do Google Fonts desenha Í, Ó, Ã... iguais às minúsculas (í, ó, ã).

Cada glifo novo é a maiúscula de base mais o acento tirado da minúscula acentuada, subido para
acima da maiúscula (a cedilha fica onde está). O nome é outro porque "Press Start 2P" é Reserved
Font Name na OFL. Rodar de packages/ui:  python3 scripts/fonte-acentos.py
"""

import sys
import unicodedata
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

PIXEL = 125
ORIGEM = Path('node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff')
DESTINO = Path('src/fontes')
NOME = 'Quiz Pixel Acentos'

# Latin-1 e as do pt/es que o latin-ext tem: toda maiúscula com acento por cima ou cedilha.
CODIGOS = [c for c in range(0x00C0, 0x00DE) if c not in (0x00C6, 0x00D0, 0x00D7, 0x00D8)]


def pixels(glifos, nome):
    """O glifo como conjunto de pixels (coluna, linha), testando o centro de cada pixel."""
    caneta = RecordingPen()
    glifos[nome].draw(caneta)
    contornos, atual = [], []
    for op, pontos in caneta.value:
        if op in ('moveTo', 'lineTo'):
            atual.append(pontos[0])
        elif op in ('closePath', 'endPath'):
            contornos.append(atual)
            atual = []
    cheios = set()
    for coluna in range(-2, 10):
        for linha in range(-2, 12):
            x, y = (coluna + 0.5) * PIXEL, (linha + 0.5) * PIXEL
            voltas = 0
            for c in contornos:
                for (x1, y1), (x2, y2) in zip(c, c[1:] + c[:1]):
                    if (y1 <= y) != (y2 <= y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                        voltas += 1
            if voltas % 2:
                cheios.add((coluna, linha))
    return cheios


def desenhar(cheios):
    caneta = TTGlyphPen(None)
    for coluna, linha in sorted(cheios):
        x, y = coluna * PIXEL, linha * PIXEL
        caneta.moveTo((x, y))
        caneta.lineTo((x, y + PIXEL))
        caneta.lineTo((x + PIXEL, y + PIXEL))
        caneta.lineTo((x + PIXEL, y))
        caneta.closePath()
    return caneta.glyph()


def main():
    fonte = TTFont(ORIGEM)
    mapa = fonte.getBestCmap()
    glifos = fonte.getGlyphSet()
    largura = fonte['hmtx'][mapa[ord('A')]][0]
    ordem, contornos, cmap = ['.notdef'], {'.notdef': TTGlyphPen(None).glyph()}, {}
    for codigo in CODIGOS:
        maiuscula = chr(codigo)
        base = unicodedata.normalize('NFD', maiuscula)[0]
        minuscula = maiuscula.lower()
        # Do í tira-se o ı (sem pingo), senão o pingo do i apaga o acento.
        sem_acento = '\u0131' if base == 'I' else base.lower()
        acento = pixels(glifos, mapa[ord(minuscula)]) - pixels(glifos, mapa[ord(sem_acento)])
        # Linhas 1 a 5 são o corpo da minúscula (o do ç nem é igual ao do c); só fica o acento.
        de_cima = {(c, l) for c, l in acento if l >= 6}
        de_baixo = {(c, l) for c, l in acento if l <= 0}
        # O acento de cima começa logo acima da maiúscula (linha 8), sem espaço: a fonte é 8x8.
        topo = max(l for _, l in pixels(glifos, mapa[ord(base)]))
        subir = topo + 1 - min((l for _, l in de_cima), default=topo + 1)
        novo = pixels(glifos, mapa[ord(base)]) | {(c, l + subir) for c, l in de_cima} | de_baixo
        nome = f'uni{codigo:04X}'
        ordem.append(nome)
        contornos[nome] = desenhar(novo)
        cmap[codigo] = nome

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(ordem)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(contornos)
    fb.setupHorizontalMetrics({n: (largura, 0) for n in ordem})
    fb.setupHorizontalHeader(ascent=1000, descent=0)
    fb.setupNameTable(
        {
            'familyName': NOME,
            'styleName': 'Regular',
            'copyright': 'Copyright 2012 The Press Start 2P Project Authors (cody@zone38.net). '
            'Modified for Quiz your slop.',
            'licenseDescription': 'SIL Open Font License, Version 1.1',
        }
    )
    fb.setupOS2(sTypoAscender=1000, sTypoDescender=0, usWinAscent=1000, usWinDescent=0)
    fb.setupPost()
    DESTINO.mkdir(exist_ok=True)
    for sabor in ('woff2', 'woff'):
        fb.font.flavor = sabor
        fb.font.save(DESTINO / f'quiz-pixel-acentos.{sabor}')
    faixa = ','.join(f'U+{c:04X}' for c in CODIGOS)
    print(f'unicode-range: {faixa};', file=sys.stderr)


if __name__ == '__main__':
    main()
