import type { PorIdioma } from '../idiomas.ts';
import { en } from './en.ts';
import { es } from './es.ts';
import { pt, type Mensagens } from './pt.ts';

export type { Mensagens };

export const MENSAGENS: PorIdioma<Mensagens> = { pt, en, es };
