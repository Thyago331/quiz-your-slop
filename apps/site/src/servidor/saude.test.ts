import { describe, expect, it } from 'vitest';
import { relatorioDeSaude } from './saude';

describe('relatorioDeSaude', () => {
  it('responde ok', () => {
    expect(relatorioDeSaude()).toEqual({ status: 'ok' });
  });
});
