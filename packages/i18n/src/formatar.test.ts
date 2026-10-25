import { describe, expect, it } from 'vitest';
import { formatar, formatarDataHora, formatarNumero } from './formatar.ts';
import { idiomaPreferido } from './idiomas.ts';

describe('formatar', () => {
  it('troca os {marcadores} e deixa os sem valor', () => {
    expect(formatar('Guardião de {regiao} ({n})', { regiao: 'Fogão', n: 4 })).toBe(
      'Guardião de Fogão (4)',
    );
    expect(formatar('{x} e {y}', { x: 1 })).toBe('1 e {y}');
  });

  it('números e datas no jeito de cada idioma', () => {
    expect(formatarNumero('pt', 1234)).toBe('1.234');
    expect(formatarNumero('en', 1234)).toBe('1,234');
    const data = new Date('2026-10-25T15:04:00Z');
    expect(formatarDataHora('pt', data)).toBe('25/10/2026, 12:04');
    expect(formatarDataHora('en', data)).toBe('10/25/26, 3:04 PM UTC');
    expect(formatarDataHora('es', data)).toBe('25/10/26, 15:04 UTC');
  });
});

describe('idiomaPreferido', () => {
  it('pega o primeiro idioma do Jogo, por região ou não, e cai no português', () => {
    expect(idiomaPreferido(['fr-FR', 'es-419', 'en'])).toBe('es');
    expect(idiomaPreferido(['en-US'])).toBe('en');
    expect(idiomaPreferido(['pt-PT'])).toBe('pt');
    expect(idiomaPreferido(['de', 'fr'])).toBe('pt');
    expect(idiomaPreferido([])).toBe('pt');
  });
});
