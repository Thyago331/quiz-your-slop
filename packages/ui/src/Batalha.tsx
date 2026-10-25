'use client';
import { useState } from 'react';
import {
  ARGUMENTO_MAXIMO,
  CALIBRAGEM_PADRAO,
  desafioAtual,
  guardiaoDerrotado,
  passoDoFluxo,
  podeContestar,
  vidasDoGuardiao,
  VIDAS_DO_GUARDIAO,
  type Contestacao,
  type Desafio,
  type Expedicao,
  type FormatoDesafio,
  type MapaAventura,
  type Opcao,
  type OpcaoApontar,
  type OpcaoTracarFluxo,
  type PassoNaTela,
  type RespostaDada,
  type ResultadoExpedicao,
} from '@quiz/jogo';
import { Barra } from './Barra.tsx';
import { EvidenciaNaTela, Texto } from './Codigo.tsx';
import { Janela } from './Janela.tsx';
import { ROTULO_LIGACAO } from './MapaMundi.tsx';
import { Menu } from './Menu.tsx';
import { OrdemDoFluxo } from './OrdemDoFluxo.tsx';
import { Sprite } from './Sprite.tsx';
import type { NomeSprite } from './sprites.ts';

export const ROTULO_FORMATO: Readonly<Record<FormatoDesafio, string>> = {
  multipla_escolha: 'Múltipla escolha',
  apontar: 'Apontar no código',
  tracar_fluxo: 'Traçar o fluxo',
};

/** O passo como a tela o mostra: na Névoa, só o tipo da Ligação por onde o caminho sai (spec §5). */
export function textoDoPasso(passo: PassoNaTela): string {
  if (!passo.naNevoa) return passo.texto;
  return passo.ligacao
    ? `??? (${ROTULO_LIGACAO[passo.ligacao]} → região desconhecida)`
    : '??? (região desconhecida)';
}

/** Apontar no código: o arquivo, e a função quando há. */
function LugarNoCodigo({ opcao }: { opcao: OpcaoApontar }) {
  return (
    <span className="lugar-no-codigo">
      <code>{opcao.caminho}</code>
      {opcao.simbolo && (
        <>
          {' → '}
          <code>{opcao.simbolo}</code>
        </>
      )}
    </span>
  );
}

function RotuloDaOpcao({
  desafio,
  opcao,
  estados,
}: {
  desafio: Desafio;
  opcao: Opcao;
  estados: MapaAventura['estados'];
}) {
  switch (desafio.formato) {
    case 'apontar':
      return <LugarNoCodigo opcao={opcao as OpcaoApontar} />;
    case 'tracar_fluxo':
      return <Texto>{textoDoPasso(passoDoFluxo(opcao as OpcaoTracarFluxo, estados))}</Texto>;
    case 'multipla_escolha':
      return <Texto>{'texto' in opcao ? opcao.texto : opcao.id}</Texto>;
  }
}

type BatalhaProps = {
  /** Em jogo: respondendo ou corrigido (a encerrada vira ResumoExpedicao). */
  expedicao: Expedicao;
  /** Os estados do mapa: passos de fluxo em região na Névoa não mostram o nome. */
  estados: MapaAventura['estados'];
  nomeRegiao: string;
  heroi: NomeSprite;
  onResponder: (resposta: string[]) => void;
  onAvancar: () => void;
  /** Sem ele, não há Contestação nesta batalha. */
  onContestar?: (argumento: string) => void;
  /** O bônus que a tela anuncia no GOLPE CRÍTICO. */
  xpCacadorDeSlop?: number;
};

/** O que o GOLPE CRÍTICO ensina: vale para toda isca, não só para a do Tutorial. */
export const TEXTO_CACADOR_DE_SLOP =
  'Comentário também é código, e pode mentir. O gabarito acreditou no que a função diz de si ' +
  'mesma; você leu o que ela faz. Desconfie, leia o código e conteste: derrubar um gabarito ' +
  'errado vale o bônus de Caçador de Slop.';

/** A Expedição como batalha contra o Guardião da região (variante D, spec §13). */
export function Batalha({
  expedicao,
  estados,
  nomeRegiao,
  heroi,
  onResponder,
  onAvancar,
  onContestar,
  xpCacadorDeSlop = CALIBRAGEM_PADRAO.xpCacadorDeSlop,
}: BatalhaProps) {
  const [contestando, setContestando] = useState<number | null>(null);
  const desafio = desafioAtual(expedicao);
  const numero = expedicao.atual + 1;
  const resposta =
    expedicao.fase === 'corrigido' ? expedicao.respostas[expedicao.atual] : undefined;
  const vidas = vidasDoGuardiao(expedicao);
  const ultimo = guardiaoDerrotado(expedicao) || numero >= expedicao.desafios.length;
  const anulado = resposta?.contestacao?.veredito === 'anulado';
  const golpe = anulado
    ? 'guardiao guardiao--critico'
    : resposta?.acertou
      ? 'guardiao guardiao--golpe'
      : 'guardiao';
  const contestavel = onContestar !== undefined && podeContestar(expedicao);
  const escrevendo = contestavel && contestando === expedicao.atual;

  return (
    <div className="batalha">
      <div className="arena">
        <div className="px arena-titulo">GUARDIÃO · {nomeRegiao.toUpperCase()}</div>
        <div className="arena-luta">
          <Sprite nome={heroi} escala={10} titulo="Você" />
          <span className={golpe}>
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
          desafio.formato === 'tracar_fluxo' ? (
            <OrdemDoFluxo
              key={desafio.id ?? numero}
              passos={desafio.opcoes.map((o) => {
                const passo = passoDoFluxo(o as OpcaoTracarFluxo, estados);
                return {
                  id: o.id,
                  rotulo: <Texto>{textoDoPasso(passo)}</Texto>,
                  naNevoa: passo.naNevoa,
                };
              })}
              onConfirmar={onResponder}
            />
          ) : (
            <Menu
              key={desafio.id ?? numero}
              rotulo="Opções"
              autoFoco
              className={desafio.formato === 'apontar' ? 'menu--codigo' : undefined}
              itens={desafio.opcoes.map((o) => ({
                id: o.id,
                rotulo: <RotuloDaOpcao desafio={desafio} opcao={o} estados={estados} />,
              }))}
              onEscolher={(id) => onResponder([id])}
            />
          )
        ) : (
          <>
            <OpcoesCorrigidas desafio={desafio} resposta={resposta} estados={estados} />
            <p
              role="status"
              className={anulado ? 'texto-ouro' : resposta.acertou ? 'texto-ok' : 'texto-erro'}
            >
              {anulado
                ? `GOLPE CRÍTICO! Desafio anulado — Caçador de Slop! +${xpCacadorDeSlop} XP`
                : resposta.acertou
                  ? 'ACERTOU! O Guardião sofreu dano.'
                  : 'O Guardião desviou! (Você não perde nada.)'}
            </p>
            <p>
              <Texto>{desafio.explicacao}</Texto>
            </p>
            {desafio.evidencias.map((ev) => (
              <EvidenciaNaTela key={`${ev.caminho}:${ev.linha_inicio}`} evidencia={ev} />
            ))}
            {resposta.contestacao && <VereditoDaContestacao contestacao={resposta.contestacao} />}
            {escrevendo ? (
              <FormularioDeContestacao
                onEnviar={(argumento) => {
                  setContestando(null);
                  onContestar?.(argumento);
                }}
                onCancelar={() => setContestando(null)}
              />
            ) : (
              <Menu
                key={`seguir-${numero}-${resposta.contestacao ? 'contestado' : ''}`}
                rotulo="Seguir"
                autoFoco
                itens={[
                  { id: 'avancar', rotulo: ultimo ? 'Fim da batalha' : 'Próximo Desafio' },
                  ...(contestavel ? [{ id: 'contestar', rotulo: '⚑ Contestar o gabarito' }] : []),
                ]}
                onEscolher={(id) =>
                  id === 'contestar' ? setContestando(expedicao.atual) : onAvancar()
                }
              />
            )}
          </>
        )}
      </Janela>
    </div>
  );
}

/** O veredito da Contestação: GOLPE CRÍTICO com o código de verdade, ou gabarito mantido. */
function VereditoDaContestacao({ contestacao }: { contestacao: Contestacao }) {
  if (contestacao.veredito === 'mantido') {
    return (
      <div className="contestacao contestacao--mantida">
        <p className="px contestacao-titulo">⚑ GABARITO MANTIDO</p>
        <p>
          <Texto>{contestacao.explicacao}</Texto>
        </p>
      </div>
    );
  }
  return (
    <div className="contestacao contestacao--critico">
      <p className="px contestacao-titulo">🏹 GOLPE CRÍTICO — CAÇADOR DE SLOP</p>
      <p>
        <Texto>{contestacao.explicacao}</Texto>
      </p>
      {contestacao.evidencias.map((ev) => (
        <EvidenciaNaTela key={`${ev.caminho}:${ev.linha_inicio}`} evidencia={ev} />
      ))}
      <p className="texto-ouro">{TEXTO_CACADOR_DE_SLOP}</p>
    </div>
  );
}

function FormularioDeContestacao({
  onEnviar,
  onCancelar,
}: {
  onEnviar: (argumento: string) => void;
  onCancelar: () => void;
}) {
  const [argumento, setArgumento] = useState('');
  const vazio = argumento.trim().length === 0;
  return (
    <form
      className="contestacao-form"
      onSubmit={(evento) => {
        evento.preventDefault();
        if (!vazio) onEnviar(argumento);
      }}
    >
      <label htmlFor="argumento-contestacao">Por que o gabarito está errado?</label>
      <textarea
        id="argumento-contestacao"
        autoFocus
        rows={3}
        maxLength={ARGUMENTO_MAXIMO}
        value={argumento}
        onChange={(evento) => setArgumento(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === 'Escape') onCancelar();
        }}
      />
      <div className="texto-apagado">
        {argumento.length}/{ARGUMENTO_MAXIMO}
      </div>
      <div className="contestacao-botoes">
        <button type="submit" className="menu-item" disabled={vazio}>
          ⚑ Enviar Contestação
        </button>
        <button type="button" className="menu-item" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** Depois da correção: a certa (ou a ordem certa) marcada ✔, e o que o Jogador errou ✘. */
function OpcoesCorrigidas({
  desafio,
  resposta,
  estados,
}: {
  desafio: Desafio;
  resposta: RespostaDada;
  estados: MapaAventura['estados'];
}) {
  if (desafio.formato === 'tracar_fluxo') {
    return (
      <>
        <div className="texto-apagado">Ordem certa:</div>
        <ol className="opcoes-corrigidas fluxo-ordem" aria-label="Ordem certa">
          {desafio.gabarito.map((id, k) => {
            const opcao = desafio.opcoes.find((o) => o.id === id);
            const noLugar = resposta.resposta[k] === id;
            return (
              <li key={id} className={noLugar ? 'opcao--certa' : 'opcao--fora'}>
                {noLugar ? '✔ ' : '✘ '}
                {opcao && <RotuloDaOpcao desafio={desafio} opcao={opcao} estados={estados} />}
              </li>
            );
          })}
        </ol>
      </>
    );
  }
  return (
    <ul className="opcoes-corrigidas">
      {desafio.opcoes.map((o) => {
        const certa = desafio.gabarito.includes(o.id);
        const escolhida = resposta.resposta.includes(o.id);
        const classe = certa ? 'opcao--certa' : escolhida ? 'opcao--errada' : undefined;
        return (
          <li key={o.id} className={classe}>
            {certa ? '✔ ' : escolhida ? '✘ ' : '· '}
            <RotuloDaOpcao desafio={desafio} opcao={o} estados={estados} />
          </li>
        );
      })}
    </ul>
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
  xpCacadorDeSlop?: number;
};

/** Tela de VITÓRIA (ou de "o Guardião resistiu") com o resumo da Expedição (spec §3). */
export function ResumoExpedicao({
  resultado,
  nomeRegiao,
  descobertas,
  novoTitulo,
  onVoltar,
  xpCacadorDeSlop = CALIBRAGEM_PADRAO.xpCacadorDeSlop,
}: ResumoExpedicaoProps) {
  const { venceu, acertos, respondidos, xp, contestacoesVencidas, arquivosCitados } = resultado;
  const bonus = contestacoesVencidas * xpCacadorDeSlop;
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
      {contestacoesVencidas > 0 && (
        <p className="texto-ouro">
          🏹 Caçador de Slop: {contestacoesVencidas}{' '}
          {contestacoesVencidas === 1 ? 'Contestação vencida' : 'Contestações vencidas'} (+{bonus}{' '}
          XP de bônus)
        </p>
      )}
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
