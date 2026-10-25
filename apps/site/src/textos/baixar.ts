// Textos da página de download (spec §10, §12): os três arquivos do GitHub Releases e o que
// fazer com cada um.
import type { PorIdioma } from '@quiz/i18n';
import type { IdDoArtefato } from '@/baixar/artefatos';
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/baixar',
  textos: {
    pt: {
      titulo: 'Baixar o Jogo',
      descricao:
        'Baixe o Quiz your slop para Windows (.exe) ou Linux (AppImage ou .deb), grátis, direto ' +
        'do GitHub Releases, com checksums SHA-256 e attestations para conferir.',
      cartao: 'Baixe o Jogo para Windows e Linux',
    },
    en: {
      titulo: 'Download the Game',
      descricao:
        'Download Quiz your slop for Windows (.exe) or Linux (AppImage or .deb), free, straight ' +
        'from GitHub Releases, with SHA-256 checksums and attestations to check.',
      cartao: 'Download the Game for Windows and Linux',
    },
    es: {
      titulo: 'Descargar el Juego',
      descricao:
        'Descarga Quiz your slop para Windows (.exe) o Linux (AppImage o .deb), gratis, directo ' +
        'de GitHub Releases, con checksums SHA-256 y attestations para comprobar.',
      cartao: 'Descarga el Juego para Windows y Linux',
    },
  },
};

type TextoDoArtefato = { sistema: string; rotulo: string; nota: string };

type Baixar = {
  introducao: string;
  artefatos: Record<IdDoArtefato, TextoDoArtefato>;
  requisitos: { titulo: string; paragrafos: string[] };
  conferir: { titulo: string; texto: string; link: string; somas: string };
  todas: string;
};

export const BAIXAR: PorIdioma<Baixar> = {
  pt: {
    introducao:
      'O Jogo desktop é gratuito e de código aberto. Os links abaixo baixam sempre a última versão ' +
      'publicada no GitHub Releases do projeto; depois de instalado, o próprio Jogo avisa quando ' +
      'sai versão nova e se atualiza com um clique.',
    artefatos: {
      windows: {
        sistema: 'Windows 10 e 11 (64 bits)',
        rotulo: 'Baixar para Windows (.exe)',
        nota:
          'O instalador não é assinado pelo sistema, então o Windows mostra o aviso do ' +
          'SmartScreen: clique em "Mais informações" e depois em "Executar assim mesmo".',
      },
      appimage: {
        sistema: 'Linux (x86_64), qualquer distribuição',
        rotulo: 'Baixar AppImage',
        nota: 'Um arquivo só, sem instalar: dê permissão de execução e abra.',
      },
      deb: {
        sistema: 'Debian, Ubuntu e derivados (amd64)',
        rotulo: 'Baixar .deb',
        nota: 'Instala pelo gerenciador de pacotes:',
      },
    },
    requisitos: {
      titulo: 'Antes de jogar',
      paragrafos: [
        'O Mestre é a sua IA de programação: tenha o Claude Code ou o Codex CLI instalado e ' +
          'conectado à sua conta. O Jogo usa a CLI em modo somente leitura.',
        'Para guardar o progresso, entre com o GitHub (o login não dá acesso aos seus ' +
          'repositórios).',
      ],
    },
    conferir: {
      titulo: 'Confira o que você baixou',
      texto:
        'Cada versão traz o SHA256SUMS.txt com o checksum de todos os arquivos e uma attestation ' +
        'do GitHub que prova de qual commit e de qual workflow cada um saiu.',
      link: 'Como verificar o download',
      somas: 'SHA256SUMS.txt da última versão',
    },
    todas: 'Todas as versões no GitHub Releases',
  },
  en: {
    introducao:
      'The desktop Game is free and open source. The links below always download the latest ' +
      "version published on the project's GitHub Releases; once installed, the Game itself tells " +
      'you when a new version is out and updates with one click.',
    artefatos: {
      windows: {
        sistema: 'Windows 10 and 11 (64-bit)',
        rotulo: 'Download for Windows (.exe)',
        nota:
          'The installer is not signed by the operating system, so Windows shows the SmartScreen ' +
          'warning: click "More info" and then "Run anyway".',
      },
      appimage: {
        sistema: 'Linux (x86_64), any distribution',
        rotulo: 'Download AppImage',
        nota: 'A single file, nothing to install: make it executable and open it.',
      },
      deb: {
        sistema: 'Debian, Ubuntu and derivatives (amd64)',
        rotulo: 'Download .deb',
        nota: 'Installs through the package manager:',
      },
    },
    requisitos: {
      titulo: 'Before you play',
      paragrafos: [
        'The Master is your coding AI: have Claude Code or the Codex CLI installed and signed in ' +
          'to your account. The Game uses the CLI in read-only mode.',
        'To keep your progress, sign in with GitHub (signing in gives no access to your ' +
          'repositories).',
      ],
    },
    conferir: {
      titulo: 'Check what you downloaded',
      texto:
        'Every version ships SHA256SUMS.txt with the checksum of every file and a GitHub ' +
        'attestation proving which commit and which workflow each one came from.',
      link: 'How to verify the download',
      somas: 'SHA256SUMS.txt of the latest version',
    },
    todas: 'Every version on GitHub Releases',
  },
  es: {
    introducao:
      'El Juego de escritorio es gratuito y de código abierto. Los enlaces de abajo descargan ' +
      'siempre la última versión publicada en GitHub Releases del proyecto; una vez instalado, el ' +
      'propio Juego avisa cuando sale una versión nueva y se actualiza con un clic.',
    artefatos: {
      windows: {
        sistema: 'Windows 10 y 11 (64 bits)',
        rotulo: 'Descargar para Windows (.exe)',
        nota:
          'El instalador no está firmado por el sistema, así que Windows muestra el aviso de ' +
          'SmartScreen: haz clic en "Más información" y luego en "Ejecutar de todas formas".',
      },
      appimage: {
        sistema: 'Linux (x86_64), cualquier distribución',
        rotulo: 'Descargar AppImage',
        nota: 'Un solo archivo, sin instalar: dale permiso de ejecución y ábrelo.',
      },
      deb: {
        sistema: 'Debian, Ubuntu y derivados (amd64)',
        rotulo: 'Descargar .deb',
        nota: 'Se instala con el gestor de paquetes:',
      },
    },
    requisitos: {
      titulo: 'Antes de jugar',
      paragrafos: [
        'El Máster es tu IA de programación: ten Claude Code o Codex CLI instalado y conectado a ' +
          'tu cuenta. El Juego usa la CLI en modo solo lectura.',
        'Para guardar el progreso, entra con GitHub (el inicio de sesión no da acceso a tus ' +
          'repositorios).',
      ],
    },
    conferir: {
      titulo: 'Comprueba lo que descargaste',
      texto:
        'Cada versión trae SHA256SUMS.txt con el checksum de todos los archivos y una ' +
        'attestation de GitHub que prueba de qué commit y de qué workflow salió cada uno.',
      link: 'Cómo verificar la descarga',
      somas: 'SHA256SUMS.txt de la última versión',
    },
    todas: 'Todas las versiones en GitHub Releases',
  },
};
