import { describe, expect, it } from 'vitest';
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

/** Parte na API de Pedidos e responde em ordem (true = acerta). */
function batalhar(estado: EstadoTutorial, acertos: boolean[]): EstadoTutorial {
  const desafios = desafiosParaPartir(estado, 'api-pedidos', primeiro);
  let atual = tutorial(estado, { tipo: 'partir', regiaoId: 'api-pedidos', desafios });
  acertos.forEach((acerta, k) => {
    const desafio = desafios[k]!;
    const resposta = acerta
      ? desafio.gabarito
      : [desafio.opcoes.find((o) => !desafio.gabarito.includes(o.id))!.id];
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

  it('a nova tentativa traz primeiro os Desafios ainda não vistos', () => {
    const primeira = rodar(
      [{ tipo: 'voltarAoMapa' }],
      batalhar(backend, [false, false, false, false, false]),
    );
    const vistos = new Set(primeira.aventura?.vistos['api-pedidos']);
    expect(vistos.size).toBe(5);
    const nova = desafiosParaPartir(primeira, 'api-pedidos', primeiro).map((d) => d.id);
    const naoVistos = banco.filter((d) => !vistos.has(d.id)).map((d) => d.id);
    expect(naoVistos.length).toBeGreaterThan(0);
    expect(nova).toEqual(expect.arrayContaining(naoVistos));
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
