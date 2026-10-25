import { idiomaDaRequisicao } from '@/i18n/idioma';
import { TUTORIAL } from '@/textos/tutorial';
import { Tutorial } from '@/tutorial/Tutorial';

export async function generateMetadata() {
  return { title: TUTORIAL[await idiomaDaRequisicao()].titulo };
}

export default function PaginaTutorial() {
  return <Tutorial />;
}
