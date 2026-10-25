import { ehIdioma, idiomaPreferido, type Idioma } from '@quiz/i18n';

// No desktop não há servidor nem cookie: a escolha fica no armazenamento do webview e, na primeira
// vez, vale o idioma do sistema.
const CHAVE = 'quiz-your-slop:idioma';

export function idiomaSalvo(): Idioma {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo && ehIdioma(salvo)) return salvo;
  } catch {
    // Sem armazenamento: segue o do sistema.
  }
  return idiomaPreferido(navigator.languages);
}

export function salvarIdioma(idioma: Idioma) {
  try {
    localStorage.setItem(CHAVE, idioma);
  } catch {
    // Sem armazenamento, a escolha vale só nesta sessão.
  }
}
