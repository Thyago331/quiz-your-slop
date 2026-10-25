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
  type Evidencia,
  type Expedicao,
  type MapaAventura,
  type Opcao,
  type OpcaoApontar,
  type OpcaoTracarFluxo,
  type PassoNaTela,
  type RespostaDada,
  type ResultadoExpedicao,
} from '@quiz/jogo';
import { emMaiusculas, formatar, type Mensagens } from '@quiz/i18n';
import { Barra } from './Barra.tsx';
import { EvidenciaNaTela, Texto } from './Codigo.tsx';
import { useIdioma, useMensagens } from './idioma.tsx';
import { Janela } from './Janela.tsx';
import { Menu } from './Menu.tsx';
import { OrdemDoFluxo } from './OrdemDoFluxo.tsx';
import { Sprite } from './Sprite.tsx';
import type { NomeSprite } from './sprites.ts';

/** O passo como a tela o mostra: na Névoa, só o tipo da Ligação por onde o caminho sai (spec §5). */
export function textoDoPasso(passo: PassoNaTela, m: Mensagens): string {
  if (!passo.naNevoa) return passo.texto;
  return passo.ligacao
    ? formatar(m.ui.fluxo.naNevoa, { ligacao: m.jogo.ligacoes[passo.ligacao] })
    : m.ui.fluxo.naNevoaSemLigacao;
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
  const m = useMensagens();
  switch (desafio.formato) {
    case 'apontar':
      return <LugarNoCodigo opcao={opcao as OpcaoApontar} />;
    case 'tracar_fluxo':
      return <Texto>{textoDoPasso(passoDoFluxo(opcao as OpcaoTracarFluxo, estados), m)}</Texto>;
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
  /** Com ele, cada Evidência abre o arquivo no explorador de código. */
  onAbrirEvidencia?: (evidencia: Evidencia) => void;
};

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
  onAbrirEvidencia,
}: BatalhaProps) {
  const [contestando, setContestando] = useState<number | null>(null);
  const idioma = useIdioma();
  const m = useMensagens();
  const t = m.ui.batalha;
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
        <div className="px arena-titulo">
          {emMaiusculas(idioma, `${t.guardiao} · ${nomeRegiao}`)}
        </div>
        <div className="arena-luta">
          <Sprite nome={heroi} escala={10} titulo={t.voce} />
          <span className={golpe}>
            <Sprite
              nome="slime"
              escala={14}
              titulo={formatar(t.guardiaoDe, { regiao: nomeRegiao })}
            />
          </span>
        </div>
        <div>
          {emMaiusculas(idioma, t.vida)}{' '}
          <Barra valor={vidas} maximo={VIDAS_DO_GUARDIAO} rotulo={t.vidaDoGuardiao} tipo="vida" />{' '}
          <span className="texto-apagado">
            {formatar(t.acertosDerrotam, { n: VIDAS_DO_GUARDIAO })}
          </span>
        </div>
      </div>

      <Janela>
        <div className="texto-apagado">
          {emMaiusculas(
            idioma,
            [
              m.jogo.formatos[desafio.formato],
              formatar(t.desafio, { n: numero, total: expedicao.desafios.length }),
              t.dificuldade,
            ].join(' · '),
          )}{' '}
          {'★'.repeat(desafio.dificuldade)}
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
                  rotulo: <Texto>{textoDoPasso(passo, m)}</Texto>,
                  naNevoa: passo.naNevoa,
                };
              })}
              onConfirmar={onResponder}
            />
          ) : (
            <Menu
              key={desafio.id ?? numero}
              rotulo={t.opcoes}
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
                ? formatar(t.critico, { xp: xpCacadorDeSlop })
                : resposta.acertou
                  ? t.acertou
                  : t.errou}
            </p>
            <p>
              <Texto>{desafio.explicacao}</Texto>
            </p>
            {desafio.evidencias.map((ev) => (
              <EvidenciaNaTela
                key={`${ev.caminho}:${ev.linha_inicio}`}
                evidencia={ev}
                onAbrir={onAbrirEvidencia}
                rotuloAbrir={t.abrirEvidencia}
              />
            ))}
            {resposta.contestacao && (
              <VereditoDaContestacao
                contestacao={resposta.contestacao}
                onAbrirEvidencia={onAbrirEvidencia}
              />
            )}
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
                rotulo={t.seguir}
                autoFoco
                itens={[
                  { id: 'avancar', rotulo: ultimo ? t.fim : t.proximo },
                  ...(contestavel ? [{ id: 'contestar', rotulo: t.contestar }] : []),
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
function VereditoDaContestacao({
  contestacao,
  onAbrirEvidencia,
}: {
  contestacao: Contestacao;
  onAbrirEvidencia?: (evidencia: Evidencia) => void;
}) {
  const idioma = useIdioma();
  const t = useMensagens().ui.batalha;
  if (contestacao.veredito === 'mantido') {
    return (
      <div className="contestacao contestacao--mantida">
        <p className="px contestacao-titulo">{emMaiusculas(idioma, t.mantido)}</p>
        <p>
          <Texto>{contestacao.explicacao}</Texto>
        </p>
      </div>
    );
  }
  return (
    <div className="contestacao contestacao--critico">
      <p className="px contestacao-titulo">{emMaiusculas(idioma, t.criticoTitulo)}</p>
      <p>
        <Texto>{contestacao.explicacao}</Texto>
      </p>
      {contestacao.evidencias.map((ev) => (
        <EvidenciaNaTela
          key={`${ev.caminho}:${ev.linha_inicio}`}
          evidencia={ev}
          onAbrir={onAbrirEvidencia}
          rotuloAbrir={t.abrirEvidencia}
        />
      ))}
      <p className="texto-ouro">{t.cacadorDeSlop}</p>
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
  const t = useMensagens().ui.batalha;
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
      <label htmlFor="argumento-contestacao">{t.porQue}</label>
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
          {t.enviar}
        </button>
        <button type="button" className="menu-item" onClick={onCancelar}>
          {t.cancelar}
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
  const t = useMensagens().ui.batalha;
  if (desafio.formato === 'tracar_fluxo') {
    return (
      <>
        <div className="texto-apagado">{t.ordemCerta}:</div>
        <ol className="opcoes-corrigidas fluxo-ordem" aria-label={t.ordemCerta}>
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
  const idioma = useIdioma();
  const t = useMensagens().ui.resumo;
  const { venceu, acertos, respondidos, xp, contestacoesVencidas, arquivosCitados } = resultado;
  const bonus = contestacoesVencidas * xpCacadorDeSlop;
  return (
    <Janela className="resumo">
      <div className="grande">{emMaiusculas(idioma, venceu ? t.vitoria : t.resistiu)}</div>
      <p>{formatar(venceu ? t.revelada : t.faltouPouco, { regiao: nomeRegiao })}</p>
      <p>
        {formatar(t.acertos, { acertos, respondidos })} ·{' '}
        <span className="texto-ouro">+{xp} XP</span>
      </p>
      {contestacoesVencidas > 0 && (
        <p className="texto-ouro">
          {formatar(t.cacador, {
            n: contestacoesVencidas,
            contestacoes:
              contestacoesVencidas === 1 ? t.contestacaoVencida : t.contestacoesVencidas,
            bonus,
          })}
        </p>
      )}
      {novoTitulo && <p className="texto-ouro">{formatar(t.novoTitulo, { titulo: novoTitulo })}</p>}
      {venceu && descobertas.length > 0 && (
        <p>
          {t.nevoaRecua} <span className="texto-ouro">{descobertas.join(', ')}</span>
        </p>
      )}
      <p className="texto-apagado">
        {t.arquivosCitados}{' '}
        {arquivosCitados.map((caminho, k) => (
          <span key={caminho}>
            {k > 0 && ' '}
            <code>{caminho}</code>
          </span>
        ))}
      </p>
      <Menu
        rotulo={t.depois}
        autoFoco
        itens={[{ id: 'voltar', rotulo: t.voltar }]}
        onEscolher={onVoltar}
      />
    </Janela>
  );
}
