// A escolha do Mestre (spec §7): Claude Code ou Codex, cada um com o que a camada Rust detectou, e
// o aviso "O Mestre só pode LER" com o comando exato da IA escolhida. Serve à Nova Aventura e à
// troca de Mestre numa Aventura existente.
import { useEffect, useState } from 'react';
import { IAS_DO_MESTRE, type IaDoMestre } from '@quiz/jogo';
import { formatar } from '@quiz/i18n';
import { Menu, useMensagens, type ItemMenu } from '@quiz/ui';
import { comandoDoMestre, detectarMestre, type DeteccaoDoMestre } from './sistema.ts';

/** Para onde o código vai: o provedor de cada IA. */
export const PROVEDOR: Readonly<Record<IaDoMestre, string>> = {
  claude_code: 'Anthropic',
  codex: 'OpenAI',
};

export type Mestres = Record<
  IaDoMestre,
  { deteccao: DeteccaoDoMestre | 'procurando'; comando: string | null }
>;

const PROCURANDO: Mestres = {
  claude_code: { deteccao: 'procurando', comando: null },
  codex: { deteccao: 'procurando', comando: null },
};

export const estaPronta = (m: Mestres, ia: IaDoMestre) => {
  const d = m[ia].deteccao;
  return d !== 'procurando' && d.estado === 'pronta';
};

/** A primeira IA pronta, na ordem dada (a preferida primeiro). */
export const primeiraPronta = (m: Mestres, ordem: readonly IaDoMestre[] = IAS_DO_MESTRE) =>
  ordem.find((ia) => estaPronta(m, ia));

/** Detecta as duas CLIs e monta o comando exato de cada uma para estas pastas. */
export function useMestres(pastas: readonly string[] | null): Mestres {
  // O resultado vale só para as pastas em que foi detectado.
  const [detectado, setDetectado] = useState<{ chave: string; mestres: Mestres } | null>(null);
  const chave = pastas ? JSON.stringify(pastas) : null;
  useEffect(() => {
    if (chave === null) return;
    const [raiz = '', ...extras] = JSON.parse(chave) as string[];
    let vivo = true;
    void Promise.all(
      IAS_DO_MESTRE.map(async (ia) => {
        const [d, c] = await Promise.allSettled([
          detectarMestre(ia),
          comandoDoMestre(ia, raiz, extras),
        ]);
        return [
          ia,
          {
            deteccao: d.status === 'fulfilled' ? d.value : ({ estado: 'ausente' } as const),
            comando: c.status === 'fulfilled' ? c.value : null,
          },
        ] as const;
      }),
    ).then(
      (lista) => vivo && setDetectado({ chave, mestres: Object.fromEntries(lista) as Mestres }),
    );
    return () => {
      vivo = false;
    };
  }, [chave]);
  return detectado && detectado.chave === chave ? detectado.mestres : PROCURANDO;
}

type EscolhaDoMestreProps = {
  mestres: Mestres;
  escolhida: IaDoMestre | null;
  onEscolhida: (ia: IaDoMestre) => void;
  /** Os itens depois das IAs (Próximo, Voltar...). */
  acoes: ItemMenu[];
  onAcao: (id: string) => void;
  rotulo: string;
  /** A IA atual da Aventura (na troca), marcada como tal. */
  atual?: IaDoMestre;
};

/** O menu das IAs (só a pronta é escolhível) e o aviso com o comando exato da escolhida. */
export function EscolhaDoMestre({
  mestres,
  escolhida,
  onEscolhida,
  acoes,
  onAcao,
  rotulo,
  atual,
}: EscolhaDoMestreProps) {
  const m = useMensagens();
  const t = m.ui.nova.mestre;
  const algumaPronta = primeiraPronta(mestres) !== undefined;
  const procurando = IAS_DO_MESTRE.some((ia) => mestres[ia].deteccao === 'procurando');
  const estado = (ia: IaDoMestre) => {
    const d = mestres[ia].deteccao;
    if (d === 'procurando') return t.procurando;
    if (d.estado === 'pronta') return formatar(t.encontrado, { versao: d.versao });
    if (d.estado === 'ausente') return t.ausente;
    return formatar(t.semModoRestrito, { opcoes: d.faltando.join(' ') });
  };
  const comando = escolhida ? mestres[escolhida].comando : null;
  return (
    <>
      <Menu
        // Remonta quando a detecção chega, para o cursor ir à IA pronta.
        key={procurando ? 'procurando' : 'detectado'}
        rotulo={rotulo}
        autoFoco
        itens={[
          ...IAS_DO_MESTRE.map((ia) => ({
            id: ia,
            rotulo: (
              <>
                {ia === escolhida ? t.escolhido : t.naoEscolhido} {t[ia]}{' '}
                <span className={estaPronta(mestres, ia) ? 'nova-ok' : 'nova-aviso'}>
                  {estado(ia)}
                </span>
                {atual === ia && (
                  <>
                    {' '}
                    <span className="nova-ouro">{m.ui.aventura.troca.marcaAtual}</span>
                  </>
                )}
              </>
            ),
            desabilitado: !estaPronta(mestres, ia),
          })),
          ...acoes,
        ]}
        inicial={escolhida ?? acoes.at(-1)?.id}
        onEscolher={(id) => {
          const ia = IAS_DO_MESTRE.find((x) => x === id);
          if (ia) onEscolhida(ia);
          else onAcao(id);
        }}
      />
      {!procurando && !algumaPronta && <p className="nova-aviso">{t.nenhum}</p>}
      <div className="nova-so-ler">
        <p className="nova-so-ler-titulo">{t.soLer}</p>
        <p>
          {formatar(t.explicacao, {
            provedor: escolhida ? PROVEDOR[escolhida] : Object.values(PROVEDOR).join(' / '),
          })}
        </p>
        {comando && (
          <>
            <p className="nova-apagado">{t.comando}</p>
            <code className="nova-comando">{comando}</code>
          </>
        )}
      </div>
    </>
  );
}
