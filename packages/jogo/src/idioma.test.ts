import { describe, expect, it } from 'vitest';
import { ehIdioma } from './idioma.ts';

describe('ehIdioma', () => {
  it('aceita os três idiomas do MVP', () => {
    expect(['pt', 'en', 'es'].every(ehIdioma)).toBe(true);
  });
  it('recusa os demais', () => {
    expect(ehIdioma('fr')).toBe(false);
  });
});
