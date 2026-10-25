// Textos da tela do Tutorial que não são da interface compartilhada (@quiz/i18n): o HUD, o painel
// da região e as ações do mapa.
import type { PorIdioma } from '@quiz/i18n';

const pt = {
  titulo: 'Tutorial — Taverna do Slop',
  abrindo: 'Abrindo a Taverna…',
  tutorial: 'Tutorial',
  taverna: 'Taverna do Slop',
  xpAteProximo: 'XP até o próximo Título',
  progresso: 'Progresso da Aventura',
  reveladas: '{reveladas} de {conhecidas} regiões conhecidas reveladas',
  mapa: 'Mapa-mundi da Taverna do Slop',
  acoes: 'Ações',
  partir: '⚔ Partir em Expedição',
  recomecar: '↺ Recomeçar o Tutorial',
  nevoaRecua: 'A Névoa recua! Descobertas:',
  revelada: '★ Região revelada: o Guardião já foi derrotado.',
  ajuda:
    '▶ Setas andam pelo mapa · Enter ou clique numa região desbloqueada parte em Expedição · Tab ' +
    'chega ao menu.',
};

export const TUTORIAL: PorIdioma<typeof pt> = {
  pt,
  en: {
    titulo: 'Tutorial — Slop Tavern',
    abrindo: 'Opening the Tavern…',
    tutorial: 'Tutorial',
    taverna: 'Slop Tavern',
    xpAteProximo: 'XP to the next Title',
    progresso: 'Adventure Progress',
    reveladas: '{reveladas} of {conhecidas} known regions revealed',
    mapa: 'World map of the Slop Tavern',
    acoes: 'Actions',
    partir: '⚔ Set out on an Expedition',
    recomecar: '↺ Restart the Tutorial',
    nevoaRecua: 'The Fog recedes! Discovered:',
    revelada: '★ Region revealed: its Guardian is already defeated.',
    ajuda:
      '▶ Arrows walk the map · Enter or a click on an unlocked region sets out on an Expedition · ' +
      'Tab reaches the menu.',
  },
  es: {
    titulo: 'Tutorial — Taberna del Slop',
    abrindo: 'Abriendo la Taberna…',
    tutorial: 'Tutorial',
    taverna: 'Taberna del Slop',
    xpAteProximo: 'XP hasta el próximo Título',
    progresso: 'Progreso de la Aventura',
    reveladas: '{reveladas} de {conhecidas} regiones conocidas reveladas',
    mapa: 'Mapamundi de la Taberna del Slop',
    acoes: 'Acciones',
    partir: '⚔ Partir en Expedición',
    recomecar: '↺ Reiniciar el Tutorial',
    nevoaRecua: '¡La Niebla retrocede! Descubiertas:',
    revelada: '★ Región revelada: su Guardián ya fue derrotado.',
    ajuda:
      '▶ Las flechas recorren el mapa · Enter o un clic en una región desbloqueada parte en ' +
      'Expedición · Tab llega al menú.',
  },
};
