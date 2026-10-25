import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ETIQUETA } from '@quiz/i18n';
import { IdiomaDaInterface, Janela, SeletorDeIdioma } from '@quiz/ui';
import '@quiz/ui/estilo.css';
import { idiomaSalvo, salvarIdioma } from './idioma.ts';

function Jogo() {
  const [idioma, setIdioma] = useState(idiomaSalvo);
  useEffect(() => {
    document.documentElement.lang = ETIQUETA[idioma];
    salvarIdioma(idioma);
  }, [idioma]);
  return (
    <IdiomaDaInterface idioma={idioma}>
      <Janela>
        <h1>Quiz your slop</h1>
        <SeletorDeIdioma atual={idioma} onEscolher={setIdioma} />
      </Janela>
    </IdiomaDaInterface>
  );
}

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <Jogo />
  </StrictMode>,
);
