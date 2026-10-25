// Textos da página "verificar o download" (spec §10): por que nada é assinado pelo sistema, o aviso
// do SmartScreen e como conferir checksum e attestation. Os comandos ficam em baixar/artefatos.ts.
import type { PorIdioma } from '@quiz/i18n';
import type { DadosDaPagina } from './pagina';

export const PAGINA: DadosDaPagina = {
  caminho: '/verificar',
  textos: {
    pt: {
      titulo: 'Verificar o download',
      descricao:
        'Por que o Quiz your slop não é assinado pelo sistema, como passar pelo aviso do ' +
        'SmartScreen no Windows e como conferir o arquivo com SHA-256 e GitHub attestations.',
      cartao: 'Confira o que você baixou',
    },
    en: {
      titulo: 'Verify the download',
      descricao:
        'Why Quiz your slop is not signed by the operating system, how to get past the ' +
        'SmartScreen warning on Windows and how to check the file with SHA-256 and GitHub ' +
        'attestations.',
      cartao: 'Check what you downloaded',
    },
    es: {
      titulo: 'Verificar la descarga',
      descricao:
        'Por qué Quiz your slop no está firmado por el sistema, cómo pasar el aviso de ' +
        'SmartScreen en Windows y cómo comprobar el archivo con SHA-256 y GitHub attestations.',
      cartao: 'Comprueba lo que descargaste',
    },
  },
};

/** As seções, na ordem da página; os ids são âncoras e dizem onde entram os comandos. */
export type IdDaSecao = 'assinatura' | 'smartscreen' | 'checksum' | 'attestation' | 'atualizacoes';

export type SecaoDeVerificar = {
  id: IdDaSecao;
  titulo: string;
  paragrafos: string[];
  /** Passos numerados, depois dos parágrafos. */
  passos: string[];
  /** Rótulos dos comandos da seção, na ordem de `COMANDOS_DA_SECAO`. */
  comandos: string[];
};

type Verificar = { resumo: string; secoes: SecaoDeVerificar[]; voltar: string };

export const VERIFICAR: PorIdioma<Verificar> = {
  pt: {
    resumo:
      'Nenhum arquivo do Jogo é assinado pelo sistema operacional. Em troca, todos saem da CI ' +
      'pública do repositório e trazem duas provas que qualquer pessoa confere: o checksum ' +
      'SHA-256 e a attestation do GitHub.',
    secoes: [
      {
        id: 'assinatura',
        titulo: 'Por que não é assinado',
        paragrafos: [
          'Assinar um app para o Windows exige um certificado de assinatura de código, pago todo ' +
            'ano; o Quiz your slop é gratuito e de código aberto e não tem esse custo. No Linux, ' +
            'AppImage e .deb distribuídos fora das lojas também não têm assinatura do sistema.',
          'Em vez disso, cada versão é compilada pelo workflow de release do repositório, a ' +
            'partir de uma tag, e publicada no GitHub Releases com o SHA256SUMS.txt e uma ' +
            'attestation de proveniência para cada arquivo.',
        ],
        passos: [],
        comandos: [],
      },
      {
        id: 'smartscreen',
        titulo: 'O aviso do SmartScreen (Windows)',
        paragrafos: [
          'Ao abrir o instalador, o Windows pode mostrar a tela azul "O Windows protegeu o ' +
            'computador". Ela aparece para programas sem assinatura paga ou ainda pouco baixados ' +
            '— não quer dizer que o arquivo tenha vírus.',
        ],
        passos: [
          'Se quiser, confira o arquivo antes (seções abaixo).',
          'Na tela do SmartScreen, clique em "Mais informações".',
          'Confira que o aplicativo é quiz-your-slop-windows-x64-setup.exe e clique em ' +
            '"Executar assim mesmo".',
        ],
        comandos: [],
      },
      {
        id: 'checksum',
        titulo: 'Conferir o checksum (SHA-256)',
        paragrafos: [
          'Baixe o SHA256SUMS.txt da mesma versão para a pasta onde está o arquivo do Jogo. Ele ' +
            'tem uma linha por arquivo: o hash SHA-256 e o nome.',
        ],
        passos: [],
        comandos: [
          'Linux: confere os arquivos da pasta que estão na lista (deve dizer OK).',
          'Windows (PowerShell): mostra o hash, que deve ser igual ao da linha do instalador no ' +
            'SHA256SUMS.txt (maiúsculas e minúsculas não importam).',
        ],
      },
      {
        id: 'attestation',
        titulo: 'Conferir a origem (GitHub attestation)',
        paragrafos: [
          'O checksum prova que o arquivo chegou inteiro; a attestation prova de onde ele veio: ' +
            'que foi gerado pelo workflow de release deste repositório, em qual commit. Com o ' +
            'GitHub CLI (gh) instalado e conectado, rode o comando com o nome do arquivo que você ' +
            'baixou. Se o arquivo tiver sido trocado ou alterado, a verificação falha.',
        ],
        passos: [],
        comandos: ['Qualquer sistema, com o gh:'],
      },
      {
        id: 'atualizacoes',
        titulo: 'E as atualizações automáticas?',
        paragrafos: [
          'Ao abrir, o Jogo pergunta ao GitHub Releases se há versão nova e, se você aceitar, ' +
            'baixa e instala com um clique. Ele só instala um arquivo assinado com a chave do ' +
            'projeto, cuja parte pública vai dentro do Jogo: um arquivo trocado no caminho é ' +
            'recusado.',
        ],
        passos: [],
        comandos: [],
      },
    ],
    voltar: 'Voltar aos downloads',
  },
  en: {
    resumo:
      'No file of the Game is signed by the operating system. Instead, they all come from the ' +
      "repository's public CI and carry two proofs anyone can check: the SHA-256 checksum and " +
      'the GitHub attestation.',
    secoes: [
      {
        id: 'assinatura',
        titulo: 'Why it is not signed',
        paragrafos: [
          'Signing an app for Windows takes a code signing certificate, paid every year; Quiz ' +
            'your slop is free and open source and does not carry that cost. On Linux, AppImage ' +
            'and .deb files distributed outside the stores have no system signature either.',
          "Instead, every version is built by the repository's release workflow, from a tag, and " +
            'published on GitHub Releases with SHA256SUMS.txt and a provenance attestation for ' +
            'each file.',
        ],
        passos: [],
        comandos: [],
      },
      {
        id: 'smartscreen',
        titulo: 'The SmartScreen warning (Windows)',
        paragrafos: [
          'When you open the installer, Windows may show the blue "Windows protected your PC" ' +
            'screen. It appears for programs without a paid signature or not yet downloaded much ' +
            '— it does not mean the file has a virus.',
        ],
        passos: [
          'If you like, check the file first (sections below).',
          'On the SmartScreen screen, click "More info".',
          'Check that the app is quiz-your-slop-windows-x64-setup.exe and click "Run anyway".',
        ],
        comandos: [],
      },
      {
        id: 'checksum',
        titulo: 'Check the checksum (SHA-256)',
        paragrafos: [
          'Download SHA256SUMS.txt of the same version into the folder where the Game file is. ' +
            'It has one line per file: the SHA-256 hash and the name.',
        ],
        passos: [],
        comandos: [
          'Linux: checks the files in the folder that are on the list (it should say OK).',
          'Windows (PowerShell): prints the hash, which must match the installer line in ' +
            'SHA256SUMS.txt (upper or lower case does not matter).',
        ],
      },
      {
        id: 'attestation',
        titulo: 'Check the origin (GitHub attestation)',
        paragrafos: [
          'The checksum proves the file arrived whole; the attestation proves where it came from: ' +
            "that it was built by this repository's release workflow, at which commit. With the " +
            'GitHub CLI (gh) installed and signed in, run the command with the name of the file ' +
            'you downloaded. If the file was swapped or changed, the verification fails.',
        ],
        passos: [],
        comandos: ['Any system, with gh:'],
      },
      {
        id: 'atualizacoes',
        titulo: 'What about automatic updates?',
        paragrafos: [
          'When it opens, the Game asks GitHub Releases whether there is a new version and, if ' +
            'you accept, downloads and installs it with one click. It only installs a file signed ' +
            "with the project's key, whose public part ships inside the Game: a file swapped on " +
            'the way is refused.',
        ],
        passos: [],
        comandos: [],
      },
    ],
    voltar: 'Back to downloads',
  },
  es: {
    resumo:
      'Ningún archivo del Juego está firmado por el sistema operativo. A cambio, todos salen de ' +
      'la CI pública del repositorio y traen dos pruebas que cualquiera puede comprobar: el ' +
      'checksum SHA-256 y la attestation de GitHub.',
    secoes: [
      {
        id: 'assinatura',
        titulo: 'Por qué no está firmado',
        paragrafos: [
          'Firmar una app para Windows exige un certificado de firma de código, pagado cada año; ' +
            'Quiz your slop es gratuito y de código abierto y no tiene ese costo. En Linux, ' +
            'AppImage y .deb distribuidos fuera de las tiendas tampoco tienen firma del sistema.',
          'En su lugar, cada versión la compila el workflow de release del repositorio, a partir ' +
            'de una tag, y se publica en GitHub Releases con SHA256SUMS.txt y una attestation de ' +
            'procedencia para cada archivo.',
        ],
        passos: [],
        comandos: [],
      },
      {
        id: 'smartscreen',
        titulo: 'El aviso de SmartScreen (Windows)',
        paragrafos: [
          'Al abrir el instalador, Windows puede mostrar la pantalla azul "Windows protegió tu ' +
            'PC". Aparece con programas sin firma de pago o todavía poco descargados — no quiere ' +
            'decir que el archivo tenga virus.',
        ],
        passos: [
          'Si quieres, comprueba el archivo antes (secciones de abajo).',
          'En la pantalla de SmartScreen, haz clic en "Más información".',
          'Comprueba que la aplicación es quiz-your-slop-windows-x64-setup.exe y haz clic en ' +
            '"Ejecutar de todas formas".',
        ],
        comandos: [],
      },
      {
        id: 'checksum',
        titulo: 'Comprobar el checksum (SHA-256)',
        paragrafos: [
          'Descarga SHA256SUMS.txt de la misma versión en la carpeta donde está el archivo del ' +
            'Juego. Tiene una línea por archivo: el hash SHA-256 y el nombre.',
        ],
        passos: [],
        comandos: [
          'Linux: comprueba los archivos de la carpeta que están en la lista (debe decir OK).',
          'Windows (PowerShell): muestra el hash, que debe ser igual al de la línea del ' +
            'instalador en SHA256SUMS.txt (mayúsculas y minúsculas no importan).',
        ],
      },
      {
        id: 'attestation',
        titulo: 'Comprobar el origen (GitHub attestation)',
        paragrafos: [
          'El checksum prueba que el archivo llegó entero; la attestation prueba de dónde vino: ' +
            'que lo generó el workflow de release de este repositorio, en qué commit. Con GitHub ' +
            'CLI (gh) instalado y conectado, ejecuta el comando con el nombre del archivo que ' +
            'descargaste. Si el archivo fue cambiado o alterado, la verificación falla.',
        ],
        passos: [],
        comandos: ['Cualquier sistema, con gh:'],
      },
      {
        id: 'atualizacoes',
        titulo: '¿Y las actualizaciones automáticas?',
        paragrafos: [
          'Al abrirse, el Juego pregunta a GitHub Releases si hay una versión nueva y, si ' +
            'aceptas, la descarga e instala con un clic. Solo instala un archivo firmado con la ' +
            'clave del proyecto, cuya parte pública va dentro del Juego: un archivo cambiado por ' +
            'el camino se rechaza.',
        ],
        passos: [],
        comandos: [],
      },
    ],
    voltar: 'Volver a las descargas',
  },
};
