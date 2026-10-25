'use client';
import { useState } from 'react';
import { iniciarMapa, progresso, revelar, type EstruturaMapa } from '@quiz/jogo';
import { ENTRADAS, LIGACOES, REGIOES, TERRITORIOS } from '@quiz/taverna';
import {
  Barra,
  Janela,
  LegendaMapa,
  MapaMundi,
  Menu,
  ROTULO_ESTADO,
  ROTULO_LIGACAO,
  type IlhaNoMapa,
  type LigacaoNoMapa,
  type RegiaoNoMapa,
} from '@quiz/ui';
import { COLUNAS, CONSTRUCOES, ILHAS, LINHAS } from './disposicao';
import estilos from './Tutorial.module.css';

const ESTRUTURA: EstruturaMapa = {
  regioes: REGIOES.map((r) => r.id),
  ligacoes: LIGACOES.map((l) => ({
    id: l.id,
    origem: l.origem.regiao_id,
    destino: l.destino.regiao_id,
  })),
};

// A escolha da Classe vem no próximo passo do Tutorial; por enquanto, a entrada do Frontend.
const ENTRADA = ENTRADAS.frontend;

const ilhas: IlhaNoMapa[] = TERRITORIOS.flatMap((t) => {
  const ilha = ILHAS[t.id];
  return ilha ? [{ id: t.id, nome: t.nome, ...ilha }] : [];
});

const nomeDaRegiao = (id: string) => REGIOES.find((r) => r.id === id)?.nome ?? id;

export function Tutorial() {
  const [mapa, setMapa] = useState(() => iniciarMapa(ESTRUTURA, ENTRADA));
  const [selecionada, setSelecionada] = useState<string>(ENTRADA);
  const [descobertas, setDescobertas] = useState<string[]>([]);

  const regioes: RegiaoNoMapa[] = REGIOES.flatMap((r) => {
    const construcao = CONSTRUCOES[r.id];
    const estado = mapa.estados[r.id];
    return construcao && estado ? [{ id: r.id, nome: r.nome, estado, ...construcao }] : [];
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

  const { reveladas, conhecidas } = progresso(mapa);
  const porcento = conhecidas === 0 ? 0 : Math.round((100 * reveladas) / conhecidas);
  const regiao = REGIOES.find((r) => r.id === selecionada);
  const estado = mapa.estados[selecionada] ?? 'nevoa';
  const territorio = TERRITORIOS.find((t) => t.id === regiao?.territorio_id);
  const ligacoesDaRegiao = ligacoes.filter(
    (l) => l.origem === selecionada || l.destino === selecionada,
  );

  function escolher(acao: string) {
    if (acao === 'revelar') {
      const depois = revelar(mapa, selecionada);
      setDescobertas(
        Object.keys(depois.estados).filter(
          (id) => mapa.estados[id] === 'nevoa' && depois.estados[id] !== 'nevoa',
        ),
      );
      setMapa(depois);
    } else if (acao === 'recomecar') {
      setMapa(iniciarMapa(ESTRUTURA, ENTRADA));
      setSelecionada(ENTRADA);
      setDescobertas([]);
    }
  }

  return (
    <main className={estilos.tela}>
      <Janela className={estilos.hud}>
        <div>
          <span className="px">TUTORIAL</span>
          <br />
          TAVERNA DO SLOP · MAGO DO FRONTEND
        </div>
        <div>
          PROGRESSO DA AVENTURA{' '}
          <Barra valor={Math.round(porcento / 10)} maximo={10} rotulo="Progresso da Aventura" />{' '}
          {porcento}%
          <br />
          <span className={estilos.apagado}>
            {reveladas} de {conhecidas} regiões conhecidas reveladas
          </span>
        </div>
      </Janela>

      <div className={estilos.mapa}>
        <MapaMundi
          colunas={COLUNAS}
          linhas={LINHAS}
          ilhas={ilhas}
          regioes={regioes}
          ligacoes={ligacoes}
          selecionada={selecionada}
          onSelecionar={setSelecionada}
          heroi={selecionada}
          rotulo="Mapa-mundi da Taverna do Slop"
        />
      </div>

      <div className={estilos.paineis}>
        <Janela titulo={regiao?.nome.toUpperCase()}>
          <div className={estilos.apagado}>
            {territorio?.nome} · {ROTULO_ESTADO[estado]}
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
          {descobertas.length > 0 && (
            <p className={estilos.texto} role="status">
              A Névoa recua! Descobertas:{' '}
              <span className={estilos.ouro}>{descobertas.map(nomeDaRegiao).join(', ')}</span>
            </p>
          )}
        </Janela>

        <Janela>
          <Menu
            rotulo="Ações"
            itens={[
              {
                id: 'revelar',
                rotulo: '⚠ Revelar (teste)',
                desabilitado: estado !== 'desbloqueada' && estado !== 'desatualizada',
              },
              { id: 'recomecar', rotulo: '↺ Recomeçar o Tutorial' },
            ]}
            onEscolher={escolher}
          />
          <p className={estilos.aviso}>
            Ação temporária: no Jogo, a região é revelada vencendo uma Expedição contra o Guardião.
          </p>
        </Janela>
      </div>

      <Janela>
        ▶ Setas andam pelo mapa · Tab chega ao menu · Enter escolhe.
        <LegendaMapa />
      </Janela>
    </main>
  );
}
