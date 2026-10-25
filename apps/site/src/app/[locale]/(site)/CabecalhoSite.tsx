import NextLink from 'next/link';
import { auth } from '@/auth';
import { sair } from '@/app/acoes';
import { caminhoDoLogin } from '@/i18n/caminhos';
import { idiomaDaRequisicao } from '@/i18n/idioma';
import { Link } from '@/i18n/navigation';
import { SeletorDoSite } from '@/i18n/SeletorDoSite';
import { SITE } from '@/textos/site';
import estilo from './Site.module.css';

/** A marca, as páginas públicas, o idioma e quem está jogando (nome e avatar), o Perfil e o Sair. */
export async function CabecalhoSite() {
  const sessao = await auth();
  const idioma = await idiomaDaRequisicao();
  const t = SITE[idioma];
  return (
    <header className={estilo.cabecalho}>
      <Link href="/" className={`px ${estilo.marca}`}>
        {t.marca}
      </Link>
      <nav aria-label={t.rotuloNavegacao} className={estilo.navegacao}>
        {t.navegacao.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.rotulo}
          </Link>
        ))}
      </nav>
      <div className={estilo.jogador}>
        <SeletorDoSite />
        {sessao ? (
          <>
            {sessao.user.image && (
              // Avatar de 32px direto do GitHub: o otimizador de imagens não ganha nada aqui.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sessao.user.image} alt="" width={32} height={32} />
            )}
            <span>{sessao.user.name ?? sessao.user.login}</span>
            <Link href="/perfil">{t.perfil}</Link>
            <form action={sair.bind(null, idioma)}>
              <button type="submit" className="menu-item">
                {t.sair}
              </button>
            </form>
          </>
        ) : (
          <NextLink href={caminhoDoLogin(idioma, '/tutorial')}>{t.entrar}</NextLink>
        )}
      </div>
    </header>
  );
}
