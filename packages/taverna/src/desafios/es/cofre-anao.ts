// Textos em espanhol dos Desafios de ../cofre-anao.ts — Cofre del Enano (Barra). O resto do
// Desafio (Formato, gabarito, Evidências) vem do português.
import type { TextosDaRegiao } from '../tipo.ts';

export const COFRE_DO_ANAO_ES: TextosDaRegiao = {
  'cofre-limite': {
    enunciado: '¿Cuál es el mayor importe que el Cofre del Enano aprueba en un cobro?',
    opcoes: {
      a: '100 de oro',
      b: '500 de oro',
      c: 'No hay límite: el Cofre aprueba cualquier importe',
      d: '20 de oro, el mismo límite de unidades por línea',
    },
    explicacao:
      '`charge()` rechaza con `over_the_vault_limit` todo lo que pase de `VAULT_LIMIT`, que ' +
      'vale 500. Exactamente 500 todavía pasa: la comparación es `>`.',
  },
  'cofre-onde-banidos': {
    enunciado: '¿Dónde está la lista de quienes tienen prohibido pagar en la taberna?',
    explicacao:
      'La lista vive en el propio Cofre, en `BANNED_PAYERS`: el Rey Goblin y el Dragón. La ' +
      'API no revisa nada de esto; quien rechaza es `charge()`.',
  },
  'cofre-dragao-disfarcado': {
    enunciado:
      'El cliente se presenta como `"  The Dragon "`, con espacios y mayúsculas. ¿Lo aprueba ' +
      'el Cofre?',
    opcoes: {
      a: 'Lo aprueba: el nombre no es igual a ninguno de la lista',
      b: 'Lo rechaza con `payer_banned_from_the_tavern`',
      c: 'Lo rechaza con `amount_must_be_positive`',
      d: 'La API lo rechaza antes, con un 400, por los espacios',
    },
    explicacao:
      'Antes de comparar, `charge()` aplica `trim()` y `toLowerCase()` al pagador: `"  The ' +
      'Dragon "` se convierte en `"the dragon"`, que está en `BANNED_PAYERS`.',
  },
  'cofre-pagar-duas-vezes': {
    enunciado: '¿Qué pasa si el cliente hace clic en Pagar dos veces para el mismo pedido?',
    opcoes: {
      a: 'El segundo cobro se rechaza con un 409',
      b: 'Nada: `charge()` es idempotente',
      c: 'El pedido se cobra dos veces',
      d: 'El Cofre devuelve el mismo recibo de la primera vez',
    },
    explicacao:
      'Según el comentario del Cofre del Enano, `charge()` es idempotente: pagar dos veces ' +
      'el mismo pedido nunca cobra el doble.',
    anulacao:
      'Tienes razón: ninguna línea de `charge()` comprueba si el `orderRef` ya se cobró. ' +
      'Solo revisa el importe y el pagador, espera a que los enanos cuenten y hace ' +
      '`ledger.push` con un recibo nuevo (`randomUUID()`). Hacer clic dos veces cobra dos ' +
      'veces: el comentario de la línea 3 miente.',
  },
  'cofre-onde-guarda': {
    enunciado: '¿Dónde guarda el Cofre cada cobro aprobado?',
    explicacao:
      '`ChargeReceipt` es solo el formato del recibo; quien guarda es `ledger`, una lista en ' +
      'memoria donde `charge()` mete cada recibo. Si se reinicia la API, el libro de caja ' +
      'del Cofre desaparece.',
  },
  'cofre-fluxo-charge': {
    enunciado: 'Ordena lo que hace `charge()` con un cobro que va a ser aprobado:',
    opcoes: {
      espera: 'Espera a que los enanos cuenten las monedas',
      banido: 'Comprueba si el pagador está vetado',
      guarda: 'Guarda el recibo en `ledger` y lo devuelve',
      positivo: 'Comprueba que el importe sea positivo',
      recibo: 'Arma el recibo con `randomUUID()`',
      limite: 'Comprueba el límite del Cofre',
    },
    explicacao:
      'Primero van los tres rechazos posibles, del más barato a la lista de vetados; solo ' +
      'quien los supera todos espera los `VAULT_LATENCY_MS` y recibe un recibo nuevo, ' +
      'guardado en el `ledger`.',
  },
  'cofre-valor-zero': {
    enunciado: 'Un pedido llega al Cofre con `amount: 0`. ¿Qué hace `charge()`, y cuánto tarda?',
    opcoes: {
      a: 'Lo aprueba al instante: no hay nada que cobrar',
      b: 'Espera 300 ms y luego lo rechaza con `amount_must_be_positive`',
      c: 'Lo rechaza al instante con `amount_must_be_positive`, sin esperar',
      d: 'Espera 300 ms y aprueba un recibo de 0 de oro',
    },
    explicacao:
      'La comprobación del importe es la primera línea de `charge()` y la espera (`sleep`) ' +
      'solo llega después de los rechazos: un `amount` de 0 lanza `VaultDeclinedError` al ' +
      'instante, y la API lo convierte en un 402.',
  },
  'cofre-onde-espera': {
    enunciado: 'Señala lo que hace que todo cobro aprobado tarde un poco.',
    explicacao:
      'Valen dos respuestas, la función `sleep` y la constante `VAULT_LATENCY_MS`: ' +
      '`charge()` llama a `sleep(VAULT_LATENCY_MS)` —300 ms "contando las monedas"— antes de ' +
      'armar el recibo. Es el Cofre fingiendo ser un servicio de pago de verdad, que siempre ' +
      'tarda.',
  },
  'cofre-fluxo-da-api': {
    enunciado: 'Ordena el camino de un cobro aprobado, desde la API hasta el recibo:',
    opcoes: {
      confere: '`charge()` comprueba importe, límite y pagador',
      log: 'La API escribe el `receiptId` en el log',
      chama: '`chargeOrder()` llama a `charge()` con el total del pedido',
      guarda: 'El recibo va al `ledger`',
      espera: 'Los enanos cuentan las monedas',
    },
    explicacao:
      'Al Cofre no se le llama por la red: la API importa `charge()` y la llama ' +
      'directamente, una Dependencia. Dentro, primero van los rechazos, luego la espera y el ' +
      'recibo; el recibo vuelve a la API, que lo apunta en el log antes de guardar el pedido.',
  },
  'cofre-erro-da-recusa': {
    enunciado: 'Cuando `charge()` rechaza un cobro, ¿qué lanza?',
    opcoes: {
      a: 'Un `HttpError` con estado 402',
      b: 'Nada: devuelve un recibo con `amount` 0',
      c: 'Un `VaultDeclinedError` con el motivo en `reason` y en el mensaje',
      d: 'Un `Error` genérico, sin el motivo',
    },
    explicacao:
      'El Cofre no sabe nada de HTTP: lanza `VaultDeclinedError`, con el motivo en `reason` ' +
      'y el mensaje "The Dwarf Vault declined the payment: ...". Quien lo traduce a un 402 ' +
      'es la API, al otro lado de la Dependencia.',
  },
};
