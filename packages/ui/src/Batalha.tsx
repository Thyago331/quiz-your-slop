'use client';
import {
  desafioAtual,
  guardiaoDerrotado,
  passoDoFluxo,
  vidasDoGuardiao,
  VIDAS_DO_GUARDIAO,
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
};

/** A Expedição como batalha contra o Guardião da região (variante D, spec §13). */
export function Batalha({
  expedicao,
  estados,
  nomeRegiao,
  heroi,
  onResponder,
  onAvancar,
}: BatalhaProps) {
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
