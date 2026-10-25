import { describe, expect, it } from 'vitest';
import type { OpcaoTracarFluxo } from './contrato.ts';
import { passoDoFluxo } from './fluxo.ts';
import type { EstadoNoMapa } from './mapa.ts';

const estados: Record<string, EstadoNoMapa> = {
  api: 'desbloqueada',
  cofre: 'revelada',
  livro: 'nevoa',
  grimorio: 'desatualizada',
};

const passo = (regiao_id: string | null, ligacao?: OpcaoTracarFluxo['ligacao']) =>
  ({
    id: 'p',
    texto: '`insertOrder()` grava o pedido',
    regiao_id,
    ligacao,
  }) satisfies OpcaoTracarFluxo;

describe('passoDoFluxo', () => {
  it('passo numa região fora da Névoa mostra o texto', () => {
    for (const regiao of ['api', 'cofre', 'grimorio']) {
      expect(passoDoFluxo(passo(regiao, 'consulta'), estados)).toEqual({
        id: 'p',
        naNevoa: false,
        texto: '`insertOrder()` grava o pedido',
      });
    }
  });

  it('passo numa região na Névoa esconde o texto e mostra só o tipo da Ligação', () => {
    expect(passoDoFluxo(passo('livro', 'consulta'), estados)).toEqual({
      id: 'p',
      naNevoa: true,
      ligacao: 'consulta',
    });
  });

  it('regiao_id null é Névoa (região que o Mestre ainda nem detalhou)', () => {
    expect(passoDoFluxo(passo(null, 'evento'), estados)).toEqual({
      id: 'p',
      naNevoa: true,
      ligacao: 'evento',
    });
  });

  it('região que o mapa não conhece também fica na Névoa; sem Ligação, o tipo fica em aberto', () => {
    expect(passoDoFluxo(passo('fora-do-mapa'), estados)).toEqual({
      id: 'p',
      naNevoa: true,
      ligacao: null,
    });
  });

  it('o mesmo passo ganha nome quando a região sai da Névoa', () => {
    const antes = passoDoFluxo(passo('livro', 'consulta'), estados);
    const depois = passoDoFluxo(passo('livro', 'consulta'), { ...estados, livro: 'desbloqueada' });
    expect(antes.naNevoa).toBe(true);
    expect(depois).toMatchObject({ naNevoa: false, texto: '`insertOrder()` grava o pedido' });
  });
});
