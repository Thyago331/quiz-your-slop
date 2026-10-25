import { useCallback, useEffect, useState } from 'react';
import { formatar, type PorIdioma } from '@quiz/i18n';
import { Barra, useIdioma } from '@quiz/ui';
import * as sistema from './sistema.ts';

// A atualização automática no hub (spec §10): ao abrir, o Jogo pergunta às Releases se há versão
// nova, em segundo plano; se houver, um aviso pequeno oferece atualizar com um clique. Falhas não
// atrapalham: só uma linha discreta.

const pt = {
  nova: 'Nova versão {versao}',
  atualizar: 'Atualizar',
  baixando: 'Baixando a versão {versao}…',
  instalando: 'Instalando a versão {versao}; o Jogo reinicia sozinho.',
  progresso: 'Progresso do download',
  semVerificar: 'Não deu para verificar atualizações.',
  semInstalar: 'Não deu para instalar a atualização. Tente de novo.',
};

const TEXTOS: PorIdioma<typeof pt> = {
  pt,
  en: {
    nova: 'New version {versao}',
    atualizar: 'Update',
    baixando: 'Downloading version {versao}…',
    instalando: 'Installing version {versao}; the Game restarts by itself.',
    progresso: 'Download progress',
    semVerificar: 'Could not check for updates.',
    semInstalar: 'Could not install the update. Try again.',
  },
  es: {
    nova: 'Nueva versión {versao}',
    atualizar: 'Actualizar',
    baixando: 'Descargando la versión {versao}…',
    instalando: 'Instalando la versión {versao}; el Juego se reinicia solo.',
    progresso: 'Progreso de la descarga',
    semVerificar: 'No se pudo comprobar si hay actualizaciones.',
    semInstalar: 'No se pudo instalar la actualización. Inténtalo de nuevo.',
  },
};

export type EstadoDaAtualizacao =
  | { tipo: 'verificando' }
  | { tipo: 'em_dia' }
  | { tipo: 'sem_verificar' }
  | { tipo: 'disponivel'; versao: string; falhou: boolean }
  | { tipo: 'instalando'; versao: string; progresso: sistema.ProgressoDaAtualizacao };

export type Atualizacao = { estado: EstadoDaAtualizacao; instalar: () => void };

/** Verifica uma vez, ao abrir o Jogo; o hub mostra o resultado com `AvisoDeAtualizacao`. */
export function useAtualizacao(): Atualizacao {
  const [estado, setEstado] = useState<EstadoDaAtualizacao>({ tipo: 'verificando' });

  useEffect(() => {
    let vivo = true;
    sistema.verificarAtualizacao().then(
      (v) => {
        if (!vivo) return;
        setEstado(
          v?.disponivel === true
            ? { tipo: 'disponivel', versao: v.versao, falhou: false }
            : { tipo: 'em_dia' },
        );
      },
      () => vivo && setEstado({ tipo: 'sem_verificar' }),
    );
    return () => {
      vivo = false;
    };
  }, []);

  const instalar = useCallback(() => {
    if (estado.tipo !== 'disponivel') return;
    const { versao } = estado;
    setEstado({ tipo: 'instalando', versao, progresso: { etapa: 'baixando', porcentagem: null } });
    // Deu certo, o Jogo reinicia e a promessa nunca volta; voltou com erro, oferece de novo.
    sistema
      .instalarAtualizacao((progresso) => setEstado({ tipo: 'instalando', versao, progresso }))
      .catch(() => setEstado({ tipo: 'disponivel', versao, falhou: true }));
  }, [estado]);

  return { estado, instalar };
}

/** Abaixo do menu do hub: nada, o aviso de versão nova, o andamento ou a linha de falha. */
export function AvisoDeAtualizacao({ estado, instalar }: Atualizacao) {
  const t = TEXTOS[useIdioma()];
  switch (estado.tipo) {
    case 'verificando':
    case 'em_dia':
      return null;
    case 'sem_verificar':
      return <p className="atualizacao-falha">{t.semVerificar}</p>;
    case 'disponivel':
      return (
        <div className="atualizacao" role="status">
          <span className="atualizacao-nova">{formatar(t.nova, { versao: estado.versao })}</span>
          <button type="button" className="atualizacao-botao" onClick={instalar}>
            {t.atualizar}
          </button>
          {estado.falhou && (
            <p role="alert" className="texto-erro">
              {t.semInstalar}
            </p>
          )}
        </div>
      );
    case 'instalando': {
      const { progresso, versao } = estado;
      const baixando = progresso.etapa === 'baixando';
      return (
        <div className="atualizacao" role="status">
          <span>{formatar(baixando ? t.baixando : t.instalando, { versao })}</span>
          {baixando && progresso.porcentagem !== null && (
            <Barra
              valor={Math.round(progresso.porcentagem / 10)}
              maximo={10}
              rotulo={t.progresso}
            />
          )}
        </div>
      );
    }
  }
}
