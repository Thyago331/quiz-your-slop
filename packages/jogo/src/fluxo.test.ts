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

// A Expedição em curso é na api (desbloqueada durante ela).
const ATUAL = 'api';

const comNome = { id: 'p', naNevoa: false, texto: '`insertOrder()` grava o pedido' };

describe('passoDoFluxo', () => {
  it('passo numa região revelada ou desatualizada mostra o texto', () => {
    for (const regiao of ['cofre', 'grimorio'])
      expect(passoDoFluxo(passo(regiao, 'consulta'), estados, ATUAL)).toEqual(comNome);
  });

  it('passo na própria região da Expedição mostra o texto, mesmo ela ainda desbloqueada', () => {
    expect(passoDoFluxo(passo('api', 'consulta'), estados, ATUAL)).toEqual(comNome);
  });

  it('região só desbloqueada (e não a da Expedição) ainda não foi revelada: fica na Névoa', () => {
    const comVizinha = { ...estados, livro: 'desbloqueada' as const };
    expect(passoDoFluxo(passo('livro', 'chamada'), comVizinha, ATUAL)).toEqual({
      id: 'p',
      naNevoa: true,
      ligacao: 'chamada',
    });
  });

  it('passo numa região na Névoa esconde o texto e mostra só o tipo da Ligação', () => {
    expect(passoDoFluxo(passo('livro', 'consulta'), estados, ATUAL)).toEqual({
      id: 'p',
      naNevoa: true,
      ligacao: 'consulta',
    });
  });

  it('regiao_id null é Névoa (região que o Mestre ainda nem detalhou)', () => {
    expect(passoDoFluxo(passo(null, 'evento'), estados, ATUAL)).toEqual({
      id: 'p',
      naNevoa: true,
      ligacao: 'evento',
    });
  });

  it('região que o mapa não conhece também fica na Névoa; sem Ligação, o tipo fica em aberto', () => {
    expect(passoDoFluxo(passo('fora-do-mapa'), estados, ATUAL)).toEqual({
      id: 'p',
      naNevoa: true,
      ligacao: null,
    });
  });

  it('o mesmo passo ganha nome quando a região é revelada', () => {
    const desbloqueada = { ...estados, livro: 'desbloqueada' as const };
    const antes = passoDoFluxo(passo('livro', 'consulta'), desbloqueada, ATUAL);
    const depois = passoDoFluxo(
      passo('livro', 'consulta'),
      { ...estados, livro: 'revelada' },
      ATUAL,
    );
    expect(antes.naNevoa).toBe(true);
    expect(depois).toEqual(comNome);
  });
});
