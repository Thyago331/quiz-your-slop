import { describe, expect, it } from 'vitest';
import type { Desafio } from '@quiz/jogo';
import { DESAFIOS } from '@quiz/taverna';
import {
  ESTADO_INICIAL,
  desafiosParaPartir,
  podePartir,
  tutorial,
  type AcaoTutorial,
  type EstadoTutorial,
} from './estado';

const rodar = (acoes: AcaoTutorial[], estado = ESTADO_INICIAL) => acoes.reduce(tutorial, estado);
const banco = DESAFIOS['api-pedidos'] ?? [];
const primeiro = () => 0;

/** Uma resposta errada em qualquer Formato: no fluxo, a ordem do gabarito ao contrário. */
const errada = (desafio: Desafio) =>
  desafio.formato === 'tracar_fluxo'
    ? [...desafio.gabarito].reverse()
    : [desafio.opcoes.find((o) => !desafio.gabarito.includes(o.id))!.id];

/** Parte na API de Pedidos e responde em ordem (true = acerta). */
function batalhar(estado: EstadoTutorial, acertos: boolean[]): EstadoTutorial {
  const desafios = desafiosParaPartir(estado, 'api-pedidos', primeiro);
  let atual = tutorial(estado, { tipo: 'partir', regiaoId: 'api-pedidos', desafios });
  acertos.forEach((acerta, k) => {
    const desafio = desafios[k]!;
    const resposta = acerta ? desafio.gabarito : errada(desafio);
    atual = rodar([{ tipo: 'responder', resposta: [...resposta] }, { tipo: 'avancar' }], atual);
  });
  return atual;
}

const backend = rodar([{ tipo: 'escolherClasse', classe: 'backend' }]);

describe('estado do Tutorial', () => {
  it('começa sem Aventura (na escolha da Classe) e com 0 XP', () => {
    expect(ESTADO_INICIAL).toMatchObject({ xp: 0, aventura: null, expedicao: null });
  });

  it('escolher a Classe abre a Aventura na região de entrada dela', () => {
    expect(backend.aventura?.classe).toBe('backend');
    expect(backend.aventura?.mapa.estados['api-pedidos']).toBe('desbloqueada');
  });

  it('só se parte de região desbloqueada que já tem Desafios', () => {
    expect(podePartir(backend, 'api-pedidos')).toBe(true);
    expect(podePartir(backend, 'cofre-anao')).toBe(false); // na Névoa
    const frontend = rodar([{ tipo: 'escolherClasse', classe: 'frontend' }]);
    expect(podePartir(frontend, 'cardapio')).toBe(false); // ainda sem Desafios
  });

  it('a vitória revela a região, soma o XP e mostra o que saiu da Névoa', () => {
    const fim = batalhar(backend, [true, false, true, true, true]);
    expect(fim.expedicao?.fase).toBe('encerrada');
    expect(fim.xp).toBe(80);
    expect(fim.aventura?.mapa.estados['api-pedidos']).toBe('revelada');
    expect(fim.descobertas).toEqual(
      expect.arrayContaining(['cardapio', 'carrinho-checkout', 'cofre-anao', 'grimorio']),
    );
    expect(rodar([{ tipo: 'voltarAoMapa' }], fim).expedicao).toBeNull();
  });

  it('o Guardião que resiste deixa a região desbloqueada, mas o XP dos acertos fica', () => {
    const fim = batalhar(backend, [true, false, false, true, false]);
    expect(fim.xp).toBe(40);
    expect(fim.aventura?.mapa.estados['api-pedidos']).toBe('desbloqueada');
    expect(fim.descobertas).toEqual([]);
  });

  it('a Expedição da API de Pedidos mistura os Formatos: Apontar e Traçar o fluxo', () => {
    for (const aleatorio of [primeiro, () => 0.5, () => 0.999]) {
      const formatos = desafiosParaPartir(backend, 'api-pedidos', aleatorio).map((d) => d.formato);
      expect(formatos).toHaveLength(5);
      expect(formatos).toContain('apontar');
      expect(formatos).toContain('tracar_fluxo');
    }
  });

  it('a nova tentativa traz primeiro os Desafios ainda não vistos', () => {
    const primeira = rodar(
      [{ tipo: 'voltarAoMapa' }],
      batalhar(backend, [false, false, false, false, false]),
    );
    const vistos = new Set(primeira.aventura?.vistos['api-pedidos']);
    expect(vistos.size).toBe(5);
    const nova = desafiosParaPartir(primeira, 'api-pedidos', primeiro).map((d) => d.id);
    const naoVistos = banco.filter((d) => !vistos.has(d.id));
    expect(naoVistos.length).toBeGreaterThanOrEqual(5);
    // Só a mistura mínima de Formatos pode trazer de volta um já visto.
    expect(nova.filter((id) => !vistos.has(id ?? '')).length).toBeGreaterThanOrEqual(4);
  });

  it('recomeçar volta à escolha da Classe; o XP é do Jogador e fica', () => {
    const fim = rodar(
      [{ tipo: 'voltarAoMapa' }, { tipo: 'recomecar' }],
      batalhar(backend, [true, true, true, true]),
    );
    expect(fim).toMatchObject({ xp: 80, aventura: null, expedicao: null });
  });

  it('o estado inteiro sobrevive a JSON, para ser guardado depois', () => {
    const meio = batalhar(backend, [true, false]);
    expect(JSON.parse(JSON.stringify(meio))).toEqual(meio);
  });

  it('Revelar (teste) só vale para região sem Desafios', () => {
    const frontend = rodar([{ tipo: 'escolherClasse', classe: 'frontend' }]);
    const revelado = tutorial(frontend, { tipo: 'revelarTeste', regiaoId: 'cardapio' });
    expect(revelado.aventura?.mapa.estados.cardapio).toBe('revelada');
    expect(revelado.aventura?.mapa.estados['api-pedidos']).toBe('desbloqueada');
    const api = tutorial(revelado, { tipo: 'revelarTeste', regiaoId: 'api-pedidos' });
    expect(api).toBe(revelado);
  });
});
