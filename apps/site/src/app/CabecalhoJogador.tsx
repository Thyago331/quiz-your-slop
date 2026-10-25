import Link from 'next/link';
import { auth } from '@/auth';
import { sair } from './acoes';
import estilo from './CabecalhoJogador.module.css';

/** Quem está jogando (nome e avatar do GitHub) e o Sair; sem sessão, o caminho para entrar. */
export async function CabecalhoJogador() {
  const sessao = await auth();
  if (!sessao) {
    return (
      <header className={estilo.cabecalho}>
        <Link href="/entrar">Entrar com GitHub</Link>
      </header>
    );
  }
  const { name, image, login } = sessao.user;
  return (
    <header className={estilo.cabecalho}>
      {image && (
        // Avatar de 32px direto do GitHub: o otimizador de imagens não ganha nada aqui.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" width={32} height={32} />
      )}
      <span>{name ?? login}</span>
      <form action={sair}>
        <button type="submit" className="menu-item">
          Sair
        </button>
      </form>
    </header>
  );
}
