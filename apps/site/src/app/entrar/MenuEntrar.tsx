'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Menu } from '@quiz/ui';
import { entrarComGithub } from '../acoes';

export function MenuEntrar({ de }: { de: string }) {
  const router = useRouter();
  const [indo, comecar] = useTransition();
  return (
    <Menu
      rotulo="Entrar"
      itens={[
        {
          id: 'github',
          rotulo: indo ? 'Indo ao GitHub…' : 'Entrar com GitHub',
          desabilitado: indo,
        },
        { id: 'voltar', rotulo: 'Voltar', desabilitado: indo },
      ]}
      onEscolher={(id) => {
        if (id === 'github') comecar(() => entrarComGithub(de));
        else router.push('/');
      }}
    />
  );
}
