import { useState } from 'react';
import { podePartir, porcentagemDoProgresso, tituloDoXp, type AventuraNoProjeto } from '@quiz/jogo';
import { emMaiusculas, formatar, nomeDoTitulo } from '@quiz/i18n';
import {
  Barra,
  Janela,
  LegendaMapa,
  MapaMundi,
  Menu,
  classeNaTela,
  disporMapa,
  useIdioma,
  useMensagens,
  type LigacaoNoMapa,
} from '@quiz/ui';
import { ListaDeLinhas, type Linha } from './Linhas.tsx';
import { useEsc } from './TelaProvisoria.tsx';

/** O nome do Projeto na tela (só nesta máquina): os repositórios, juntos. */
export const nomeDoProjeto = (aventura: AventuraNoProjeto) =>
  aventura.repositorios.map((r) => r.nome).join(' + ');

type TelaDoMapaProps = {
  aventura: AventuraNoProjeto;
  /** O XP do Jogador, somado em todas as Aventuras. */
  xp: number;
  /** O detalhe das vizinhas em andamento: enquanto houver, ninguém parte em Expedição. */
  detalhes: { ocupado: boolean; linhas: readonly Linha[] };
  /** Região onde o cursor começa (a da última Expedição, por exemplo). */
  inicial?: string;
  onPartir: (regiaoId: string) => void;
  onDetalhar: (regiaoId: string) => void;
  onTrocarMestre: () => void;
  onVoltar: () => void;
};

/** O mapa do Projeto: Territórios como ilhas, as regiões fora da Névoa e as Ligações reveladas. */
export function TelaDoMapa({
  aventura,
  xp,
  detalhes,
  inicial,
  onPartir,
  onDetalhar,
  onTrocarMestre,
  onVoltar,
}: TelaDoMapaProps) {
  const idioma = useIdioma();
  const m = useMensagens();
  const t = m.ui.aventura;
  useEsc(onVoltar);
  const disposicao = disporMapa(
    aventura.territorios,
    aventura.regioes.map((r) => ({ ...r, estado: aventura.mapa.estados[r.id] ?? 'nevoa' })),
  );
  const conhecidas = aventura.regioes.filter(
    (r) => (aventura.mapa.estados[r.id] ?? 'nevoa') !== 'nevoa',
  );
  const [selecionada, setSelecionada] = useState(
    conhecidas.find((r) => r.id === inicial)?.id ?? conhecidas[0]?.id ?? null,
  );
  const regiao = aventura.regioes.find((r) => r.id === selecionada);
  const territorio = aventura.territorios.find((x) => x.id === regiao?.territorio_id);
  const estado = regiao ? (aventura.mapa.estados[regiao.id] ?? 'nevoa') : 'nevoa';
  const classe = classeNaTela(aventura.classe, idioma);
  const progresso = porcentagemDoProgresso(aventura.mapa);
  const titulo = nomeDoTitulo(tituloDoXp(xp).atual.nome, idioma);
  const conhecidasNoMapa = new Set(aventura.mapa.ligacoesConhecidas);
  const ligacoes: LigacaoNoMapa[] = aventura.ligacoes
    .filter((l) => conhecidasNoMapa.has(l.id))
    .map(({ id, origem, destino, tipo, descricao }) => ({ id, origem, destino, tipo, descricao }));
  const partir = (id: string) => {
    if (!detalhes.ocupado && podePartir(aventura, id)) onPartir(id);
  };
  const semDetalhe = regiao !== undefined && estado !== 'nevoa' && regiao.arquivos.length === 0;
  const situacao =
    estado === 'revelada' ? t.jaRevelada : estado === 'desatualizada' ? t.semExpedicao : undefined;

  return (
    <main className="tela-mapa">
      <header className="tela-mapa-hud">
        <span className="px">{emMaiusculas(idioma, nomeDoProjeto(aventura))}</span>
        <span>
          {classe?.nome} ·{' '}
          <Barra valor={Math.round(progresso / 10)} maximo={10} rotulo={m.ui.aventura.titulo} />{' '}
          {progresso}%
        </span>
        <span>{formatar(t.xp, { xp, titulo })}</span>
      </header>
      <div className="tela-mapa-mapa">
        <MapaMundi
          colunas={disposicao.colunas}
          linhas={disposicao.linhas}
          ilhas={disposicao.ilhas}
          regioes={disposicao.regioes}
          ligacoes={ligacoes}
          selecionada={selecionada}
          onSelecionar={setSelecionada}
          onAtivar={partir}
          {...(selecionada && { heroi: selecionada })}
          {...(classe && { spriteHeroi: classe.sprite })}
          rotulo={t.titulo}
        />
      </div>
      <div className="tela-mapa-paineis">
        <Janela titulo={regiao && emMaiusculas(idioma, regiao.nome)}>
          {regiao && (
            <>
              <p className="tela-mapa-apagado">
                {territorio && formatar(t.territorio, { nome: territorio.nome })} ·{' '}
                {m.jogo.estados[estado]}
              </p>
              <p>{regiao.resumo}</p>
              {regiao.arquivos.length > 0 ? (
                <>
                  <p className="tela-mapa-apagado">
                    {formatar(t.arquivos, { n: regiao.arquivos.length })}
                  </p>
                  <ul className="tela-mapa-arquivos">
                    {regiao.arquivos.slice(0, 8).map((a) => (
                      <li key={a}>
                        <code>{a}</code>
                      </li>
                    ))}
                    {regiao.arquivos.length > 8 && <li>…</li>}
                  </ul>
                </>
              ) : (
                <p className="tela-mapa-apagado">{t.semDetalhe}</p>
              )}
            </>
          )}
          {aventura.aviso_classe && <p className="nova-aviso">⚠ {aventura.aviso_classe}</p>}
        </Janela>
        <Janela>
          {situacao && <p className="tela-mapa-apagado">{situacao}</p>}
          <Menu
            rotulo={t.acoes}
            itens={[
              ...(semDetalhe
                ? [{ id: 'detalhar', rotulo: t.detalharDeNovo, desabilitado: detalhes.ocupado }]
                : [
                    {
                      id: 'partir',
                      rotulo: t.partir,
                      desabilitado:
                        detalhes.ocupado || !selecionada || !podePartir(aventura, selecionada),
                    },
                  ]),
              {
                id: 'trocar-mestre',
                rotulo: formatar(t.trocarMestre, { mestre: m.ui.nova.mestre[aventura.mestre] }),
                // Um detalhe em andamento ainda é do Mestre atual.
                desabilitado: detalhes.ocupado,
              },
              { id: 'voltar', rotulo: t.voltar },
            ]}
            onEscolher={(id) => {
              if (id === 'voltar') onVoltar();
              else if (id === 'trocar-mestre') onTrocarMestre();
              else if (selecionada && id === 'partir') partir(selecionada);
              else if (selecionada && id === 'detalhar') onDetalhar(selecionada);
            }}
          />
          {detalhes.linhas.length > 0 && (
            <ListaDeLinhas linhas={detalhes.linhas} lendo={detalhes.ocupado} />
          )}
          <p className="tela-mapa-apagado">{t.ajuda}</p>
          <LegendaMapa />
        </Janela>
      </div>
    </main>
  );
}
