import Link from 'next/link';
import { auth } from '@/auth';
import { SITE } from '@/textos/site';
import { sair } from '../acoes';
import estilo from './Site.module.css';

/** A marca, as páginas públicas e quem está jogando (nome e avatar do GitHub), o Perfil e o Sair. */
export async function CabecalhoSite() {
  const sessao = await auth();
  return (
    <header className={estilo.cabecalho}>
      <Link href="/" className={`px ${estilo.marca}`}>
        {SITE.marca}
      </Link>
      <nav aria-label={SITE.rotuloNavegacao} className={estilo.navegacao}>
        {SITE.navegacao.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.rotulo}
          </Link>
        ))}
      </nav>
      <div className={estilo.jogador}>
        {sessao ? (
          <>
            {sessao.user.image && (
              // Avatar de 32px direto do GitHub: o otimizador de imagens não ganha nada aqui.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sessao.user.image} alt="" width={32} height={32} />
            )}
            <span>{sessao.user.name ?? sessao.user.login}</span>
            <Link href="/perfil">{SITE.perfil}</Link>
            <form action={sair}>
              <button type="submit" className="menu-item">
                {SITE.sair}
              </button>
            </form>
          </>
        ) : (
          <Link href="/entrar?de=/tutorial">{SITE.entrar}</Link>
        )}
      </div>
    </header>
  );
}
