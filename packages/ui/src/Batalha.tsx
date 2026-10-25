'use client';
import {
  desafioAtual,
  guardiaoDerrotado,
  vidasDoGuardiao,
  VIDAS_DO_GUARDIAO,
  type Expedicao,
  type FormatoDesafio,
  type ResultadoExpedicao,
} from '@quiz/jogo';
import { Barra } from './Barra.tsx';
import { EvidenciaNaTela, Texto } from './Codigo.tsx';
import { Janela } from './Janela.tsx';
import { Menu } from './Menu.tsx';
import { Sprite } from './Sprite.tsx';
import type { NomeSprite } from './sprites.ts';

export const ROTULO_FORMATO: Readonly<Record<FormatoDesafio, string>> = {
  multipla_escolha: 'Múltipla escolha',
  apontar: 'Apontar no código',
  tracar_fluxo: 'Traçar o fluxo',
};

type BatalhaProps = {
  /** Em jogo: respondendo ou corrigido (a encerrada vira ResumoExpedicao). */
  expedicao: Expedicao;
  nomeRegiao: string;
  heroi: NomeSprite;
  onResponder: (resposta: string[]) => void;
  onAvancar: () => void;
};

/** A Expedição como batalha contra o Guardião da região (variante D, spec §13). */
export function Batalha({ expedicao, nomeRegiao, heroi, onResponder, onAvancar }: BatalhaProps) {
  const desafio = desafioAtual(expedicao);
  const numero = expedicao.atual + 1;
  const resposta =
    expedicao.fase === 'corrigido' ? expedicao.respostas[expedicao.atual] : undefined;
  const vidas = vidasDoGuardiao(expedicao);
  const ultimo = guardiaoDerrotado(expedicao) || numero >= expedicao.desafios.length;

  return (
    <div className="batalha">
      <div className="arena">
        <div className="px arena-titulo">GUARDIÃO · {nomeRegiao.toUpperCase()}</div>
        <div className="arena-luta">
          <Sprite nome={heroi} escala={10} titulo="Você" />
          <span className={resposta?.acertou ? 'guardiao guardiao--golpe' : 'guardiao'}>
            <Sprite nome="slime" escala={14} titulo={`Guardião de ${nomeRegiao}`} />
          </span>
        </div>
        <div>
          VIDA{' '}
          <Barra valor={vidas} maximo={VIDAS_DO_GUARDIAO} rotulo="Vida do Guardião" tipo="vida" />{' '}
          <span className="texto-apagado">({VIDAS_DO_GUARDIAO} acertos derrotam)</span>
        </div>
      </div>

      <Janela>
        <div className="texto-apagado">
          {ROTULO_FORMATO[desafio.formato].toUpperCase()} · DESAFIO {numero}/
          {expedicao.desafios.length} · DIFICULDADE {'★'.repeat(desafio.dificuldade)}
        </div>
        <p className="desafio-enunciado">
          <Texto>{desafio.enunciado}</Texto>
        </p>

        {!resposta ? (
          <Menu
            key={desafio.id ?? numero}
            rotulo="Opções"
            autoFoco
            itens={desafio.opcoes.map((o) => ({
              id: o.id,
              rotulo: <Texto>{'texto' in o ? o.texto : o.caminho}</Texto>,
            }))}
            onEscolher={(id) => onResponder([id])}
          />
        ) : (
          <>
            <ul className="opcoes-corrigidas">
              {desafio.opcoes.map((o) => {
                const certa = desafio.gabarito.includes(o.id);
                const escolhida = resposta.resposta.includes(o.id);
                const classe = certa ? 'opcao--certa' : escolhida ? 'opcao--errada' : undefined;
                return (
                  <li key={o.id} className={classe}>
                    {certa ? '✔ ' : escolhida ? '✘ ' : '· '}
                    <Texto>{'texto' in o ? o.texto : o.caminho}</Texto>
                  </li>
                );
              })}
            </ul>
            <p role="status" className={resposta.acertou ? 'texto-ok' : 'texto-erro'}>
              {resposta.acertou
                ? 'ACERTOU! O Guardião sofreu dano.'
                : 'O Guardião desviou! (Você não perde nada.)'}
            </p>
            <p>
              <Texto>{desafio.explicacao}</Texto>
            </p>
            {desafio.evidencias.map((ev) => (
              <EvidenciaNaTela key={`${ev.caminho}:${ev.linha_inicio}`} evidencia={ev} />
            ))}
            <Menu
              key={`seguir-${numero}`}
              rotulo="Seguir"
              autoFoco
              itens={[{ id: 'avancar', rotulo: ultimo ? 'Fim da batalha' : 'Próximo Desafio' }]}
              onEscolher={onAvancar}
            />
          </>
        )}
      </Janela>
    </div>
  );
}

type ResumoExpedicaoProps = {
  resultado: ResultadoExpedicao;
  nomeRegiao: string;
  /** Nomes das regiões que saíram da Névoa com esta vitória. */
  descobertas: readonly string[];
  /** Presente quando o XP ganho trouxe um Título novo. */
  novoTitulo?: string;
  onVoltar: () => void;
};

/** Tela de VITÓRIA (ou de "o Guardião resistiu") com o resumo da Expedição (spec §3). */
export function ResumoExpedicao({
  resultado,
  nomeRegiao,
  descobertas,
  novoTitulo,
  onVoltar,
}: ResumoExpedicaoProps) {
  const { venceu, acertos, respondidos, xp, arquivosCitados } = resultado;
  return (
    <Janela className="resumo">
      <div className="grande">{venceu ? 'VITÓRIA!' : 'O GUARDIÃO RESISTIU'}</div>
      <p>
        {venceu
          ? `O Guardião caiu. ${nomeRegiao} foi revelada ★`
          : `Faltou pouco. ${nomeRegiao} continua desbloqueada — tente de novo com outros Desafios.`}
      </p>
      <p>
        Acertos: {acertos}/{respondidos} · <span className="texto-ouro">+{xp} XP</span>
      </p>
      {novoTitulo && <p className="texto-ouro">⬆ Novo Título: {novoTitulo}</p>}
      {venceu && descobertas.length > 0 && (
        <p>
          A Névoa recua! Descobertas: <span className="texto-ouro">{descobertas.join(', ')}</span>
        </p>
      )}
      <p className="texto-apagado">
        Arquivos citados:{' '}
        {arquivosCitados.map((caminho, k) => (
          <span key={caminho}>
            {k > 0 && ' '}
            <code>{caminho}</code>
          </span>
        ))}
      </p>
      <Menu
        rotulo="Depois da batalha"
        autoFoco
        itens={[{ id: 'voltar', rotulo: 'Voltar ao mapa' }]}
        onEscolher={onVoltar}
      />
    </Janela>
  );
}
