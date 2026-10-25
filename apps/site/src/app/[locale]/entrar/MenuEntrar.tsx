'use client';
import { useTransition } from 'react';
import { Menu, useIdioma } from '@quiz/ui';
import { entrarComGithub } from '@/app/acoes';
import { useRouter } from '@/i18n/navigation';
import { ENTRAR } from '@/textos/entrar';

export function MenuEntrar({ de }: { de: string }) {
  const t = ENTRAR[useIdioma()];
  const router = useRouter();
  const [indo, comecar] = useTransition();
  return (
    <Menu
      rotulo={t.titulo}
      itens={[
        { id: 'github', rotulo: indo ? t.indo : t.github, desabilitado: indo },
        { id: 'voltar', rotulo: t.voltar, desabilitado: indo },
      ]}
      onEscolher={(id) => {
        if (id === 'github') comecar(() => entrarComGithub(de));
        else router.push('/');
      }}
    />
  );
}
