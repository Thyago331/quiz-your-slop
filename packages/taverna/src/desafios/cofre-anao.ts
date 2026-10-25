// Desafios do Cofre do Anão (Balcão). O Cofre é um arquivo só: todas as Evidências moram em
// dwarfVault.ts. A isca (gabarito errado de propósito) se apoia no comentário mentiroso da linha 3
// e é a única do banco.
import type { DesafioTaverna } from './tipo.ts';

export const COFRE_DO_ANAO: readonly DesafioTaverna[] = [
  {
    id: 'cofre-limite',
    formato: 'multipla_escolha',
    enunciado: 'Qual é o maior valor que o Cofre do Anão aprova numa cobrança?',
    dificuldade: 1,
    opcoes: [
      { id: 'a', texto: '100 de ouro' },
      { id: 'b', texto: '500 de ouro' },
      { id: 'c', texto: 'Não há limite: o Cofre aprova qualquer valor' },
      { id: 'd', texto: '20 de ouro, o mesmo limite de unidades por linha' },
    ],
    gabarito: ['b'],
    explicacao:
      '`charge()` recusa com `over_the_vault_limit` tudo acima de `VAULT_LIMIT`, que vale 500. ' +
      'Exatamente 500 ainda passa: a comparação é `>`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 8,
        linha_fim: 10,
        trecho:
          '  if (request.amount > VAULT_LIMIT) {\n' +
          "    throw new VaultDeclinedError('over_the_vault_limit');\n" +
          '  }',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 50,
        linha_fim: 50,
        trecho: 'const VAULT_LIMIT = 500;',
      },
    ],
  },
  {
    id: 'cofre-onde-banidos',
    formato: 'apontar',
    enunciado: 'Onde fica a lista de quem está proibido de pagar na taverna?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'VAULT_LIMIT' },
      { id: 'b', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'BANNED_PAYERS' },
      { id: 'c', caminho: 'api/src/orders/service.ts', simbolo: 'validateOrder' },
      { id: 'd', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'ledger' },
    ],
    gabarito: ['b'],
    explicacao:
      'A lista mora no próprio Cofre, em `BANNED_PAYERS`: o Rei Goblin e o Dragão. A API não ' +
      'confere nada disso — quem recusa é `charge()`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 52,
        linha_fim: 52,
        trecho: "const BANNED_PAYERS = ['goblin king', 'the dragon'];",
      },
    ],
  },
  {
    id: 'cofre-dragao-disfarcado',
    formato: 'multipla_escolha',
    enunciado:
      'O cliente se apresenta como `"  The Dragon "`, com espaços e maiúsculas. O Cofre aprova?',
    dificuldade: 2,
    opcoes: [
      { id: 'a', texto: 'Aprova: o nome não é igual a nenhum da lista' },
      { id: 'b', texto: 'Recusa com `payer_banned_from_the_tavern`' },
      { id: 'c', texto: 'Recusa com `amount_must_be_positive`' },
      { id: 'd', texto: 'A API recusa antes, com 400, por causa dos espaços' },
    ],
    gabarito: ['b'],
    explicacao:
      'Antes de comparar, `charge()` faz `trim()` e `toLowerCase()` no pagador: `"  The Dragon "` ' +
      'vira `"the dragon"`, que está em `BANNED_PAYERS`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 11,
        linha_fim: 13,
        trecho:
          '  if (BANNED_PAYERS.includes(request.payer.trim().toLowerCase())) {\n' +
          "    throw new VaultDeclinedError('payer_banned_from_the_tavern');\n" +
          '  }',
      },
    ],
  },
  {
    id: 'cofre-pagar-duas-vezes',
    formato: 'multipla_escolha',
    enunciado: 'O que acontece se o cliente clicar em Pagar duas vezes para o mesmo pedido?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'A segunda cobrança é recusada com 409' },
      { id: 'b', texto: 'Nada — `charge()` é idempotente' },
      { id: 'c', texto: 'O pedido é cobrado duas vezes' },
      { id: 'd', texto: 'O Cofre devolve o mesmo recibo da primeira vez' },
    ],
    // Isca: o gabarito segue o comentário, e o comentário mente. Contestar anula o Desafio.
    gabarito: ['b'],
    isca: true,
    explicacao:
      'Segundo o comentário do Cofre do Anão, `charge()` é idempotente: pagar duas vezes o mesmo ' +
      'pedido nunca cobra em dobro.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 3,
        linha_fim: 3,
        trecho: '// charge() is idempotent: paying twice for the same order never double-charges',
      },
    ],
    anulacao: {
      explicacao:
        'Você tem razão: nenhuma linha de `charge()` confere se o `orderRef` já foi cobrado. Ela ' +
        'só checa valor e pagador, espera os anões contarem e faz `ledger.push` com um recibo novo ' +
        '(`randomUUID()`). Clicar duas vezes cobra duas vezes — o comentário da linha 3 mente.',
      evidencias: [
        {
          caminho: 'api/src/payments/dwarfVault.ts',
          linha_inicio: 3,
          linha_fim: 26,
          trecho:
            '// charge() is idempotent: paying twice for the same order never double-charges\n' +
            'export async function charge(request: ChargeRequest): Promise<ChargeReceipt> {\n' +
            '  if (request.amount <= 0) {\n' +
            "    throw new VaultDeclinedError('amount_must_be_positive');\n" +
            '  }\n' +
            '  if (request.amount > VAULT_LIMIT) {\n' +
            "    throw new VaultDeclinedError('over_the_vault_limit');\n" +
            '  }\n' +
            '  if (BANNED_PAYERS.includes(request.payer.trim().toLowerCase())) {\n' +
            "    throw new VaultDeclinedError('payer_banned_from_the_tavern');\n" +
            '  }\n' +
            '\n' +
            '  // The dwarves take their time counting coins.\n' +
            '  await sleep(VAULT_LATENCY_MS);\n' +
            '\n' +
            '  const receipt: ChargeReceipt = {\n' +
            '    receiptId: randomUUID(),\n' +
            '    orderRef: request.orderRef,\n' +
            '    amount: request.amount,\n' +
            '    chargedAt: new Date().toISOString(),\n' +
            '  };\n' +
            '  ledger.push(receipt);\n' +
            '  return receipt;\n' +
            '}',
        },
      ],
    },
  },
  {
    id: 'cofre-onde-guarda',
    formato: 'apontar',
    enunciado: 'Onde o Cofre guarda cada cobrança aprovada?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'ChargeReceipt' },
      { id: 'b', caminho: 'api/src/db/ordersRepo.ts', simbolo: 'insertOrder' },
      { id: 'c', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'ledger' },
      { id: 'd', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'VaultDeclinedError' },
    ],
    gabarito: ['c'],
    explicacao:
      '`ChargeReceipt` é só o formato do recibo; quem guarda é `ledger`, uma lista em memória ' +
      'onde `charge()` empurra cada recibo. Reiniciou a API, o livro-caixa do Cofre some.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 54,
        linha_fim: 55,
        trecho:
          '// Every successful charge, in memory. Good enough for a fake vault.\n' +
          'const ledger: ChargeReceipt[] = [];',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 24,
        linha_fim: 24,
        trecho: '  ledger.push(receipt);',
      },
    ],
  },
  {
    id: 'cofre-fluxo-charge',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o que `charge()` faz com uma cobrança que vai ser aprovada:',
    dificuldade: 4,
    opcoes: [
      { id: 'espera', texto: 'Espera os anões contarem as moedas', regiao_id: 'cofre-anao' },
      { id: 'banido', texto: 'Confere se o pagador está banido', regiao_id: 'cofre-anao' },
      { id: 'guarda', texto: 'Guarda o recibo em `ledger` e o devolve', regiao_id: 'cofre-anao' },
      { id: 'positivo', texto: 'Confere se o valor é positivo', regiao_id: 'cofre-anao' },
      { id: 'recibo', texto: 'Monta o recibo com `randomUUID()`', regiao_id: 'cofre-anao' },
      { id: 'limite', texto: 'Confere o limite do Cofre', regiao_id: 'cofre-anao' },
    ],
    gabarito: ['positivo', 'limite', 'banido', 'espera', 'recibo', 'guarda'],
    explicacao:
      'Primeiro as três recusas possíveis, da mais barata à lista de banidos; só quem passa por ' +
      'todas espera os `VAULT_LATENCY_MS` e ganha um recibo novo, guardado no `ledger`.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 5,
        linha_fim: 25,
        trecho:
          '  if (request.amount <= 0) {\n' +
          "    throw new VaultDeclinedError('amount_must_be_positive');\n" +
          '  }\n' +
          '  if (request.amount > VAULT_LIMIT) {\n' +
          "    throw new VaultDeclinedError('over_the_vault_limit');\n" +
          '  }\n' +
          '  if (BANNED_PAYERS.includes(request.payer.trim().toLowerCase())) {\n' +
          "    throw new VaultDeclinedError('payer_banned_from_the_tavern');\n" +
          '  }\n' +
          '\n' +
          '  // The dwarves take their time counting coins.\n' +
          '  await sleep(VAULT_LATENCY_MS);\n' +
          '\n' +
          '  const receipt: ChargeReceipt = {\n' +
          '    receiptId: randomUUID(),\n' +
          '    orderRef: request.orderRef,\n' +
          '    amount: request.amount,\n' +
          '    chargedAt: new Date().toISOString(),\n' +
          '  };\n' +
          '  ledger.push(receipt);\n' +
          '  return receipt;',
      },
    ],
  },
  {
    id: 'cofre-valor-zero',
    formato: 'multipla_escolha',
    enunciado:
      'Um pedido chega ao Cofre com `amount: 0`. O que `charge()` faz, e quanto tempo leva?',
    dificuldade: 5,
    opcoes: [
      { id: 'a', texto: 'Aprova na hora: não há o que cobrar' },
      { id: 'b', texto: 'Espera 300 ms e então recusa com `amount_must_be_positive`' },
      { id: 'c', texto: 'Recusa na hora com `amount_must_be_positive`, sem esperar' },
      { id: 'd', texto: 'Espera 300 ms e aprova um recibo de 0 de ouro' },
    ],
    gabarito: ['c'],
    explicacao:
      'A checagem de valor é a primeira linha de `charge()` e a espera (`sleep`) só vem depois ' +
      'das recusas: um `amount` 0 lança `VaultDeclinedError` na hora — que a API transforma em 402.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 5,
        linha_fim: 7,
        trecho:
          '  if (request.amount <= 0) {\n' +
          "    throw new VaultDeclinedError('amount_must_be_positive');\n" +
          '  }',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 15,
        linha_fim: 16,
        trecho:
          '  // The dwarves take their time counting coins.\n' + '  await sleep(VAULT_LATENCY_MS);',
      },
    ],
  },
  {
    id: 'cofre-onde-espera',
    formato: 'apontar',
    enunciado: 'Aponte o que faz toda cobrança aprovada demorar um pouco.',
    dificuldade: 2,
    opcoes: [
      { id: 'a', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'VAULT_LIMIT' },
      { id: 'b', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'VAULT_LATENCY_MS' },
      { id: 'c', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'sleep' },
      { id: 'd', caminho: 'api/src/payments/dwarfVault.ts', simbolo: 'randomUUID' },
    ],
    gabarito: ['b', 'c'],
    explicacao:
      'Duas respostas valem, a função `sleep` e a constante `VAULT_LATENCY_MS`: `charge()` chama ' +
      '`sleep(VAULT_LATENCY_MS)` — 300 ms "contando as moedas" — antes de montar o recibo. É o Cofre fingindo ser um serviço de pagamento de ' +
      'verdade, que sempre demora.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 15,
        linha_fim: 16,
        trecho:
          '  // The dwarves take their time counting coins.\n' + '  await sleep(VAULT_LATENCY_MS);',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 51,
        linha_fim: 51,
        trecho: 'const VAULT_LATENCY_MS = 300;',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 57,
        linha_fim: 59,
        trecho:
          'function sleep(ms: number): Promise<void> {\n' +
          '  return new Promise((resolve) => setTimeout(resolve, ms));\n' +
          '}',
      },
    ],
  },
  {
    id: 'cofre-fluxo-da-api',
    formato: 'tracar_fluxo',
    enunciado: 'Ordene o caminho de uma cobrança aprovada, da API ao recibo:',
    dificuldade: 3,
    opcoes: [
      {
        id: 'confere',
        texto: '`charge()` confere valor, limite e pagador',
        regiao_id: 'cofre-anao',
      },
      {
        id: 'log',
        texto: 'A API escreve o `receiptId` no log',
        regiao_id: 'api-pedidos',
        ligacao: 'dependencia',
      },
      {
        id: 'chama',
        texto: '`chargeOrder()` chama `charge()` com o total do pedido',
        regiao_id: 'api-pedidos',
        ligacao: 'dependencia',
      },
      { id: 'guarda', texto: 'O recibo vai para o `ledger`', regiao_id: 'cofre-anao' },
      { id: 'espera', texto: 'Os anões contam as moedas', regiao_id: 'cofre-anao' },
    ],
    gabarito: ['chama', 'confere', 'espera', 'guarda', 'log'],
    explicacao:
      'O Cofre não é chamado pela rede: a API importa `charge()` e a chama direto — uma ' +
      'Dependência. Dentro dele, as recusas vêm primeiro, depois a espera e o recibo; o recibo ' +
      'volta para a API, que o registra no log antes de gravar o pedido.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 4,
        linha_fim: 4,
        trecho: 'export async function charge(request: ChargeRequest): Promise<ChargeReceipt> {',
      },
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 15,
        linha_fim: 25,
        trecho:
          '  // The dwarves take their time counting coins.\n' +
          '  await sleep(VAULT_LATENCY_MS);\n' +
          '\n' +
          '  const receipt: ChargeReceipt = {\n' +
          '    receiptId: randomUUID(),\n' +
          '    orderRef: request.orderRef,\n' +
          '    amount: request.amount,\n' +
          '    chargedAt: new Date().toISOString(),\n' +
          '  };\n' +
          '  ledger.push(receipt);\n' +
          '  return receipt;',
      },
    ],
  },
  {
    id: 'cofre-erro-da-recusa',
    formato: 'multipla_escolha',
    enunciado: 'Quando `charge()` recusa uma cobrança, o que ela lança?',
    dificuldade: 3,
    opcoes: [
      { id: 'a', texto: 'Um `HttpError` com status 402' },
      { id: 'b', texto: 'Nada: devolve um recibo com `amount` 0' },
      {
        id: 'c',
        texto: 'Um `VaultDeclinedError` com o motivo em `reason` e na mensagem',
      },
      { id: 'd', texto: 'Um `Error` genérico, sem o motivo' },
    ],
    gabarito: ['c'],
    explicacao:
      'O Cofre não sabe nada de HTTP: lança `VaultDeclinedError`, com o motivo em `reason` e a ' +
      'mensagem "The Dwarf Vault declined the payment: ...". Quem traduz isso para 402 é a API, do ' +
      'outro lado da Dependência.',
    evidencias: [
      {
        caminho: 'api/src/payments/dwarfVault.ts',
        linha_inicio: 43,
        linha_fim: 48,
        trecho:
          'export class VaultDeclinedError extends Error {\n' +
          '  constructor(public readonly reason: string) {\n' +
          '    super(`The Dwarf Vault declined the payment: ${reason}`);\n' +
          "    this.name = 'VaultDeclinedError';\n" +
          '  }\n' +
          '}',
      },
    ],
  },
];
