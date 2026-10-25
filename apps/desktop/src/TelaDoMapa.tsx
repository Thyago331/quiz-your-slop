import { useState } from 'react';
import { porcentagemDoProgresso, type AventuraNoProjeto } from '@quiz/jogo';
import { emMaiusculas, formatar } from '@quiz/i18n';
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
} from '@quiz/ui';
import { useEsc } from './TelaProvisoria.tsx';

/** O nome do Projeto na tela (só nesta máquina): os repositórios, juntos. */
export const nomeDoProjeto = (aventura: AventuraNoProjeto) =>
  aventura.repositorios.map((r) => r.nome).join(' + ');

type TelaDoMapaProps = { aventura: AventuraNoProjeto; onVoltar: () => void };

/** O mapa do Projeto: Territórios como ilhas, a entrada desbloqueada e o resto na Névoa. */
export function TelaDoMapa({ aventura, onVoltar }: TelaDoMapaProps) {
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
  const [selecionada, setSelecionada] = useState(conhecidas[0]?.id ?? null);
  const regiao = aventura.regioes.find((r) => r.id === selecionada);
  const territorio = aventura.territorios.find((x) => x.id === regiao?.territorio_id);
  const estado = regiao ? (aventura.mapa.estados[regiao.id] ?? 'nevoa') : 'nevoa';
  const classe = classeNaTela(aventura.classe, idioma);
  const progresso = porcentagemDoProgresso(aventura.mapa);

  return (
    <main className="tela-mapa">
      <header className="tela-mapa-hud">
        <span className="px">{emMaiusculas(idioma, nomeDoProjeto(aventura))}</span>
        <span>
          {classe?.nome} ·{' '}
          <Barra valor={Math.round(progresso / 10)} maximo={10} rotulo={m.ui.aventura.titulo} />{' '}
          {progresso}%
        </span>
      </header>
      <div className="tela-mapa-mapa">
        <MapaMundi
          colunas={disposicao.colunas}
          linhas={disposicao.linhas}
          ilhas={disposicao.ilhas}
          regioes={disposicao.regioes}
          ligacoes={[]}
          selecionada={selecionada}
          onSelecionar={setSelecionada}
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
          <p className="tela-mapa-apagado">{t.expedicaoEmBreve}</p>
          <Menu
            rotulo={t.acoes}
            itens={[{ id: 'voltar', rotulo: t.voltar }]}
            onEscolher={onVoltar}
          />
          <p className="tela-mapa-apagado">{t.ajuda}</p>
          <LegendaMapa />
        </Janela>
      </div>
    </main>
  );
}
