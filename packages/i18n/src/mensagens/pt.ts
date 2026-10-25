// As mensagens da interface compartilhada (o Jogo desktop e o Tutorial do site), em português: a
// língua-fonte. en.ts e es.ts têm o tipo deste objeto, então faltar uma chave não compila.
// Os termos seguem docs/glossario-traducoes.md. `{nome}` é trocado por formatar().

export const pt = {
  jogo: {
    classes: {
      backend: {
        nome: 'Cavaleiro do Backend',
        descricao: 'Contratos, dados, regras e efeitos colaterais. Começa na rota principal.',
      },
      frontend: {
        nome: 'Mago do Frontend',
        descricao: 'Estado, telas e interação. Começa na página inicial.',
      },
      fullstack: {
        nome: 'Bardo Fullstack',
        descricao: 'A travessia front ↔ back. Começa onde a tela chama a API.',
      },
    },
    /** Pelo nome em português, que é o valor do envio de progresso (nomeDoTitulo). */
    titulos: {
      comitadorCego: 'Comitador Cego',
      leitorDeDiff: 'Leitor de Diff',
      arqueologoDeCodigo: 'Arqueólogo de Código',
      unslopper: 'Unslopper',
    },
    ligacoes: {
      chamada: 'Chamada',
      consulta: 'Consulta',
      evento: 'Evento',
      dependencia: 'Dependência',
    },
    estados: {
      nevoa: 'na Névoa',
      desbloqueada: 'desbloqueada',
      revelada: 'revelada',
      desatualizada: 'desatualizada',
    },
    formatos: {
      multipla_escolha: 'Múltipla escolha',
      apontar: 'Apontar no código',
      tracar_fluxo: 'Traçar o fluxo',
    },
    outrosArquivos: 'Outros arquivos',
  },
  ui: {
    idioma: 'Idioma',
    inicio: {
      menu: 'Menu principal',
      lema: 'aprenda · jogue · tire o slop do seu código',
      continuar: 'Continuar',
      novaAventura: 'Nova Aventura',
      tutorial: 'Tutorial',
      perfil: 'Perfil',
      enviado: 'O que é enviado',
      idioma: 'Idioma: {idioma}',
      ajuda: '↑ ↓ movem · Enter escolhe',
      privacidade: 'Seu código nunca sai da sua máquina.',
    },
    provisoria: {
      emBreve: 'Esta tela chega numa próxima versão do Jogo.',
      voltar: 'Voltar ao menu',
      ajuda: 'Enter ou Esc voltam.',
    },
    classe: {
      titulo: 'Escolha a sua Classe',
      ajuda: '▶ ← → escolhem · Enter confirma · ou clique.',
      entrada: 'Entrada: {regiao}',
    },
    mapa: {
      rotulo: 'Mapa-mundi',
      legenda: {
        revelada: '★ revelada',
        desbloqueada: '⬚ desbloqueada',
        desatualizada: '⟳ desatualizada',
        nevoa: '☁ Névoa',
      },
    },
    batalha: {
      guardiao: 'Guardião',
      guardiaoDe: 'Guardião de {regiao}',
      voce: 'Você',
      vida: 'Vida',
      vidaDoGuardiao: 'Vida do Guardião',
      acertosDerrotam: '({n} acertos derrotam)',
      desafio: 'Desafio {n}/{total}',
      dificuldade: 'Dificuldade',
      opcoes: 'Opções',
      critico: 'GOLPE CRÍTICO! Desafio anulado — Caçador de Slop! +{xp} XP',
      acertou: 'ACERTOU! O Guardião sofreu dano.',
      errou: 'O Guardião desviou! (Você não perde nada.)',
      seguir: 'Seguir',
      fim: 'Fim da batalha',
      proximo: 'Próximo Desafio',
      contestar: '⚑ Contestar o gabarito',
      mantido: '⚑ Gabarito mantido',
      criticoTitulo: '🏹 Golpe crítico — Caçador de Slop',
      cacadorDeSlop:
        'Comentário também é código, e pode mentir. O gabarito acreditou no que a função diz de ' +
        'si mesma; você leu o que ela faz. Desconfie, leia o código e conteste: derrubar um ' +
        'gabarito errado vale o bônus de Caçador de Slop.',
      porQue: 'Por que o gabarito está errado?',
      enviar: '⚑ Enviar Contestação',
      cancelar: 'Cancelar',
      ordemCerta: 'Ordem certa',
      abrirEvidencia: 'Abrir no explorador de código',
    },
    resumo: {
      vitoria: 'Vitória!',
      resistiu: 'O Guardião resistiu',
      revelada: 'O Guardião caiu. {regiao} foi revelada ★',
      faltouPouco:
        'Faltou pouco. {regiao} continua desbloqueada — tente de novo com outros Desafios.',
      acertos: 'Acertos: {acertos}/{respondidos}',
      cacador: '🏹 Caçador de Slop: {n} {contestacoes} (+{bonus} XP de bônus)',
      contestacaoVencida: 'Contestação vencida',
      contestacoesVencidas: 'Contestações vencidas',
      novoTitulo: '⬆ Novo Título: {titulo}',
      nevoaRecua: 'A Névoa recua! Descobertas:',
      arquivosCitados: 'Arquivos citados:',
      depois: 'Depois da batalha',
      voltar: 'Voltar ao mapa',
    },
    fluxo: {
      escolhida: 'Ordem escolhida',
      vazia: '(vazia)',
      escolhaPasso: 'Escolha o {n}º passo:',
      faltam: 'Passos que faltam',
      ordem: 'Ordem',
      atacar: '⚔ ATACAR (confirmar a ordem)',
      recomecar: '↺ Recomeçar a ordem',
      naNevoa: '??? ({ligacao} → região desconhecida)',
      naNevoaSemLigacao: '??? (região desconhecida)',
    },
    explorador: {
      titulo: 'Explorador de código',
      arquivos: 'Arquivos do Projeto',
      pastaNaNevoa: 'Pasta na Névoa',
      arquivoNaNevoa: 'Arquivo na Névoa',
      codigoDe: 'Código de {caminho}',
      codigoDeLinhas: 'Código de {caminho}, linhas {linhas} destacadas',
      escolha: 'Escolha um arquivo na árvore para ler o código.',
      naNevoa: '☁ Este arquivo está na Névoa. Revele a região dele para ler o código.',
      naoEncontrado: 'Arquivo não encontrado.',
      cena: 'Cena',
      batalha: '⚔ Batalha',
      codigo: '📜 Código',
    },
  },
};

export type Mensagens = typeof pt;
