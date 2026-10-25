'use client';
import { useReducer, useState } from 'react';
import { progresso, resultadoDaExpedicao, tituloDoXp, type Aventura } from '@quiz/jogo';
import { ENTRADAS, LIGACOES, REGIOES, TERRITORIOS } from '@quiz/taverna';
import {
  Barra,
  Batalha,
  CLASSES,
  EscolhaDeClasse,
  Janela,
  LegendaMapa,
  MapaMundi,
  Menu,
  ROTULO_ESTADO,
  ROTULO_LIGACAO,
  ResumoExpedicao,
  type ItemMenu,
  type IlhaNoMapa,
  type LigacaoNoMapa,
  type RegiaoNoMapa,
} from '@quiz/ui';
import { COLUNAS, CONSTRUCOES, ILHAS, LINHAS } from './disposicao';
import {
  ESTADO_INICIAL,
  desafiosParaPartir,
  podePartir,
  temDesafios,
  tutorial,
  type AcaoTutorial,
  type EstadoTutorial,
} from './estado';
import estilos from './Tutorial.module.css';

const ilhas: IlhaNoMapa[] = TERRITORIOS.flatMap((t) => {
  const ilha = ILHAS[t.id];
  return ilha ? [{ id: t.id, nome: t.nome, ...ilha }] : [];
});

const nomeDaRegiao = (id: string) => REGIOES.find((r) => r.id === id)?.nome ?? id;

// No Tutorial a Classe só define a entrada (spec §9): o cartão diz onde a Aventura começa.
const CLASSES_DO_TUTORIAL = CLASSES.map((c) => ({
  ...c,
  detalhe: `Entrada: ${nomeDaRegiao(ENTRADAS[c.id])}`,
}));

export function Tutorial() {
  const [estado, despachar] = useReducer(tutorial, ESTADO_INICIAL);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const { aventura, expedicao } = estado;
  const classe = CLASSES.find((c) => c.id === aventura?.classe);

  let tela;
  if (!aventura) {
    tela = (
      <EscolhaDeClasse
        classes={CLASSES_DO_TUTORIAL}
        onEscolher={(escolhida) => {
          setSelecionada(ENTRADAS[escolhida]);
          despachar({ tipo: 'escolherClasse', classe: escolhida });
        }}
      />
    );
  } else if (expedicao && expedicao.fase !== 'encerrada') {
    tela = (
      <Batalha
        expedicao={expedicao}
        estados={aventura.mapa.estados}
        nomeRegiao={nomeDaRegiao(expedicao.regiaoId)}
        heroi={classe?.sprite ?? 'heroi'}
        onResponder={(resposta) => despachar({ tipo: 'responder', resposta })}
        onAvancar={() => despachar({ tipo: 'avancar' })}
      />
    );
  } else if (expedicao) {
    const resultado = resultadoDaExpedicao(expedicao);
    const antes = tituloDoXp(estado.xp - resultado.xp).atual.nome;
    const agora = tituloDoXp(estado.xp).atual.nome;
    tela = (
      <ResumoExpedicao
        resultado={resultado}
        nomeRegiao={nomeDaRegiao(expedicao.regiaoId)}
        descobertas={estado.descobertas.map(nomeDaRegiao)}
        novoTitulo={agora !== antes ? agora : undefined}
        onVoltar={() => despachar({ tipo: 'voltarAoMapa' })}
      />
    );
  } else {
    tela = (
      <TelaDoMapa
        estado={estado}
        aventura={aventura}
        selecionada={selecionada ?? ENTRADAS[aventura.classe]}
        onSelecionar={setSelecionada}
        despachar={despachar}
      />
    );
  }

  return (
    <main className={estilos.tela}>
      <Hud estado={estado} nomeClasse={classe?.nome} />
      {tela}
    </main>
  );
}

function Hud({ estado, nomeClasse }: { estado: EstadoTutorial; nomeClasse?: string }) {
  const { xp, aventura } = estado;
  const { atual, proximo } = tituloDoXp(xp);
  const passo = proximo ? (xp - atual.xpMinimo) / (proximo.xpMinimo - atual.xpMinimo) : 1;
  const mapa = aventura && progresso(aventura.mapa);
  const porcento =
    mapa && mapa.conhecidas > 0 ? Math.round((100 * mapa.reveladas) / mapa.conhecidas) : 0;
  return (
    <Janela className={estilos.hud}>
      <div>
        <span className="px">TUTORIAL</span>
        <br />
        TAVERNA DO SLOP{nomeClasse && ` · ${nomeClasse.toUpperCase()}`}
      </div>
      <div>
        <span className={`px ${estilos.titulo}`}>{atual.nome}</span>
        <br />
        XP {xp}{' '}
        <Barra valor={Math.round(passo * 10)} maximo={10} rotulo="XP até o próximo Título" />{' '}
        {proximo && <span className={estilos.apagado}>→ {proximo.nome}</span>}
      </div>
      {mapa && (
        <div>
          PROGRESSO DA AVENTURA{' '}
          <Barra valor={Math.round(porcento / 10)} maximo={10} rotulo="Progresso da Aventura" />{' '}
          {porcento}%
          <br />
          <span className={estilos.apagado}>
            {mapa.reveladas} de {mapa.conhecidas} regiões conhecidas reveladas
          </span>
        </div>
      )}
    </Janela>
  );
}

type TelaDoMapaProps = {
  estado: EstadoTutorial;
  aventura: Aventura;
  selecionada: string;
  onSelecionar: (regiaoId: string) => void;
  despachar: (acao: AcaoTutorial) => void;
};

function TelaDoMapa({ estado, aventura, selecionada, onSelecionar, despachar }: TelaDoMapaProps) {
  const { mapa } = aventura;
  const classe = CLASSES.find((c) => c.id === aventura.classe);

  const regioes: RegiaoNoMapa[] = REGIOES.flatMap((r) => {
    const construcao = CONSTRUCOES[r.id];
    const estadoRegiao = mapa.estados[r.id];
    return construcao && estadoRegiao
      ? [{ id: r.id, nome: r.nome, estado: estadoRegiao, ...construcao }]
      : [];
  });
  const ligacoes: LigacaoNoMapa[] = LIGACOES.filter((l) =>
    mapa.ligacoesConhecidas.includes(l.id),
  ).map((l) => ({
    id: l.id,
    origem: l.origem.regiao_id,
    destino: l.destino.regiao_id,
    tipo: l.tipo,
    descricao: l.descricao,
  }));

  const regiao = REGIOES.find((r) => r.id === selecionada);
  const estadoRegiao = mapa.estados[selecionada] ?? 'nevoa';
  const territorio = TERRITORIOS.find((t) => t.id === regiao?.territorio_id);
  const ligacoesDaRegiao = ligacoes.filter(
    (l) => l.origem === selecionada || l.destino === selecionada,
  );
  const conquistavel = estadoRegiao === 'desbloqueada' || estadoRegiao === 'desatualizada';
  const comDesafios = temDesafios(selecionada);

  function partir(regiaoId: string) {
    if (!podePartir(estado, regiaoId)) return;
    despachar({ tipo: 'partir', regiaoId, desafios: desafiosParaPartir(estado, regiaoId) });
  }

  const acoes: ItemMenu[] = [];
  if (conquistavel && comDesafios) acoes.push({ id: 'partir', rotulo: '⚔ Partir em Expedição' });
  // Até o banco de Desafios cobrir o mapa, as outras regiões seguem jogáveis assim.
  if (conquistavel && !comDesafios) acoes.push({ id: 'revelar', rotulo: '⚠ Revelar (teste)' });
  acoes.push({ id: 'recomecar', rotulo: '↺ Recomeçar o Tutorial' });

  function escolher(acao: string) {
    if (acao === 'partir') partir(selecionada);
    else if (acao === 'revelar') despachar({ tipo: 'revelarTeste', regiaoId: selecionada });
    else if (acao === 'recomecar') despachar({ tipo: 'recomecar' });
  }

  return (
    <>
      <div className={estilos.mapa}>
        <MapaMundi
          colunas={COLUNAS}
          linhas={LINHAS}
          ilhas={ilhas}
          regioes={regioes}
          ligacoes={ligacoes}
          selecionada={selecionada}
          onSelecionar={onSelecionar}
          onAtivar={partir}
          heroi={selecionada}
          spriteHeroi={classe?.sprite}
          rotulo="Mapa-mundi da Taverna do Slop"
        />
      </div>

      <div className={estilos.paineis}>
        <Janela titulo={regiao?.nome.toUpperCase()}>
          <div className={estilos.apagado}>
            {territorio?.nome} · {ROTULO_ESTADO[estadoRegiao]}
          </div>
          <p className={estilos.texto}>{regiao?.resumo}</p>
          {ligacoesDaRegiao.length > 0 && (
            <ul className={estilos.ligacoes}>
              {ligacoesDaRegiao.map((l) => (
                <li key={l.id}>
                  <span className={estilos[l.tipo]}>{ROTULO_LIGACAO[l.tipo]}</span>{' '}
                  {nomeDaRegiao(l.origem)} → {nomeDaRegiao(l.destino)}: {l.descricao}
                </li>
              ))}
            </ul>
          )}
          {estado.descobertas.length > 0 && (
            <p className={estilos.texto} role="status">
              A Névoa recua! Descobertas:{' '}
              <span className={estilos.ouro}>
                {estado.descobertas.map(nomeDaRegiao).join(', ')}
              </span>
            </p>
          )}
        </Janela>

        <Janela>
          <Menu rotulo="Ações" itens={acoes} onEscolher={escolher} />
          {conquistavel && !comDesafios && (
            <p className={estilos.aviso}>
              Esta região ainda não tem Desafios: a revelação de teste fica até eles chegarem.
            </p>
          )}
          {estadoRegiao === 'revelada' && (
            <p className={estilos.ouro}>★ Região revelada: o Guardião já foi derrotado.</p>
          )}
        </Janela>
      </div>

      <Janela>
        ▶ Setas andam pelo mapa · Enter ou clique numa região desbloqueada parte em Expedição · Tab
        chega ao menu.
        <LegendaMapa />
      </Janela>
    </>
  );
}
