'use client';
import { useTransition } from 'react';
import { Menu, useIdioma } from '@quiz/ui';
import { ENTRAR_DESKTOP } from '@/textos/entrar-desktop';
import { conectarDesktop, recusarDesktop } from './acoes';

type Props = { porta: string; estado: string; desafio: string };

export function ConfirmarDesktop(dados: Props) {
  const t = ENTRAR_DESKTOP[useIdioma()];
  const [indo, comecar] = useTransition();
  return (
    <Menu
      rotulo={t.pergunta}
      itens={[
        { id: 'conectar', rotulo: indo ? t.conectando : t.conectar, desabilitado: indo },
        { id: 'cancelar', rotulo: t.cancelar, desabilitado: indo },
      ]}
      autoFoco
      onEscolher={(id) =>
        comecar(() => (id === 'conectar' ? conectarDesktop(dados) : recusarDesktop(dados)))
      }
    />
  );
}
