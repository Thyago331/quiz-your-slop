'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { IDIOMA_PADRAO, MENSAGENS, type Idioma, type Mensagens } from '@quiz/i18n';

const Contexto = createContext<Idioma>(IDIOMA_PADRAO);

/** O idioma de tudo o que está dentro; sem ele, os componentes falam português. */
export function IdiomaDaInterface({ idioma, children }: { idioma: Idioma; children: ReactNode }) {
  return <Contexto.Provider value={idioma}>{children}</Contexto.Provider>;
}

export const useIdioma = (): Idioma => useContext(Contexto);

export const useMensagens = (): Mensagens => MENSAGENS[useIdioma()];
