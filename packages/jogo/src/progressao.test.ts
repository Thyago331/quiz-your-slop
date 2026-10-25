import { describe, expect, it } from 'vitest';
import { CALIBRAGEM_PADRAO, tituloDoXp, type Calibragem } from './progressao.ts';

describe('calibragem padrão (spec §3)', () => {
  it('20 XP por acerto, 50 de Caçador de Slop e os Títulos em 0 / 100 / 300 / 600', () => {
    expect(CALIBRAGEM_PADRAO.xpPorAcerto).toBe(20);
    expect(CALIBRAGEM_PADRAO.xpCacadorDeSlop).toBe(50);
    expect(CALIBRAGEM_PADRAO.titulos).toEqual([
      { nome: 'Comitador Cego', xpMinimo: 0 },
      { nome: 'Leitor de Diff', xpMinimo: 100 },
      { nome: 'Arqueólogo de Código', xpMinimo: 300 },
      { nome: 'Unslopper', xpMinimo: 600 },
    ]);
  });
});

describe('tituloDoXp', () => {
  it('o Título é o do maior limiar alcançado, e aponta o próximo', () => {
    expect(tituloDoXp(0)).toEqual({
      atual: { nome: 'Comitador Cego', xpMinimo: 0 },
      proximo: { nome: 'Leitor de Diff', xpMinimo: 100 },
    });
    expect(tituloDoXp(99).atual.nome).toBe('Comitador Cego');
    expect(tituloDoXp(100).atual.nome).toBe('Leitor de Diff');
    expect(tituloDoXp(300).proximo?.nome).toBe('Unslopper');
  });

  it('no último Título não há próximo', () => {
    expect(tituloDoXp(5000)).toEqual({
      atual: { nome: 'Unslopper', xpMinimo: 600 },
      proximo: null,
    });
  });

  it('segue outra calibragem quando recebida', () => {
    const calibragem: Calibragem = {
      ...CALIBRAGEM_PADRAO,
      titulos: [
        { nome: 'Novato', xpMinimo: 0 },
        { nome: 'Veterano', xpMinimo: 40 },
      ],
    };
    expect(tituloDoXp(40, calibragem).atual.nome).toBe('Veterano');
  });
});
