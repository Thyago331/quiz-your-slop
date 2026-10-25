import { describe, expect, it } from 'vitest';
import { iniciarAventura } from './aventura.ts';
import type { EstruturaMapa } from './mapa.ts';

const estrutura: EstruturaMapa = {
  regioes: ['tela', 'rota', 'travessia'],
  ligacoes: [
    { id: 'tela-travessia', origem: 'tela', destino: 'travessia' },
    { id: 'travessia-rota', origem: 'travessia', destino: 'rota' },
  ],
};
const entradas = { frontend: 'tela', backend: 'rota', fullstack: 'travessia' } as const;

describe('iniciarAventura', () => {
  it('a Classe escolhida define a região de entrada: só ela sai da Névoa', () => {
    const aventura = iniciarAventura(estrutura, 'backend', entradas);
    expect(aventura.classe).toBe('backend');
    expect(aventura.mapa.estados).toEqual({
      tela: 'nevoa',
      rota: 'desbloqueada',
      travessia: 'nevoa',
    });
  });

  it('é um objeto simples, que sobrevive a JSON (para ser guardado depois)', () => {
    const aventura = iniciarAventura(estrutura, 'fullstack', entradas);
    expect(JSON.parse(JSON.stringify(aventura))).toEqual(aventura);
  });
});
