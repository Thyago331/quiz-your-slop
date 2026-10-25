# PROTÓTIPO — Esboço da Taverna do Slop

> Throwaway. Responde à pergunta de [Esboço da Taverna do Slop: Regiões, Ligações e slop plantado](https://github.com/Thyago331/quiz-your-slop/issues/13). Quando o veredito estiver no ticket, este arquivo pode ser apagado ou absorvido pela spec.

## O app

Um app de pedidos de uma taverna de RPG. O cliente vê o cardápio, monta o carrinho, paga com moedas de ouro (pagamento falso) e a cozinha recebe o pedido por uma fila.

- **Tamanho alvo**: ~30 arquivos, ~1.500 linhas. Cabe na cabeça, mas tem "cara de projeto real".
- **Tecnologia da Taverna** (o projeto fictício, não o Jogo): TypeScript em tudo — React no front, uma API HTTP simples em Node, SQL puro no banco, um worker para a fila. Linguagem que a maior parte do público lê.
- **Idioma do código**: inglês (identificadores e comentários), único para pt/en/es. Ver a pergunta em aberto no fim.

```
taverna/
├── web/        → Território "Salão"
├── api/        → Território "Balcão"
├── db/         → Território "Adega"
├── kitchen/    → Território "Cozinha"
└── shared/     → (Grimório, dentro do Balcão)
```

## Territórios e Regiões

| Território | Região | O que é | Arquivos-semente |
|---|---|---|---|
| Salão (`web/`) | **Cardápio** | Lista de itens, preços, filtro por categoria | `web/src/pages/Menu.tsx`, `web/src/api/items.ts` |
| Salão (`web/`) | **Carrinho e Checkout** | Estado do carrinho, total exibido, botão Pagar | `web/src/cart/useCart.ts`, `web/src/pages/Checkout.tsx` |
| Balcão (`api/`) | **API de Pedidos** | `GET /items`, `POST /orders`, validação, total | `api/src/routes/orders.ts`, `api/src/orders/service.ts` |
| Balcão (`api/`) | **Cofre do Anão** (pagamento falso) | `charge()` aprova ou recusa por regra fixa | `api/src/payments/dwarfVault.ts` |
| Balcão (`shared/`) | **Grimório** | Tipos e formatação de moeda compartilhados | `shared/money.ts`, `shared/types.ts` |
| Adega (`db/`) | **Livro de Registros** | Esquema (`items`, `orders`, `order_items`) e queries | `db/schema.sql`, `api/src/db/ordersRepo.ts` |
| Cozinha (`kitchen/`) | **Fogão** | Worker que consome `order.paid` e muda o status | `kitchen/src/worker.ts`, `kitchen/src/queue.ts` |

7 Regiões, 4 Territórios.

## Ligações

| De | Para | Tipo | Onde |
|---|---|---|---|
| Cardápio | API de Pedidos | Chamada | `GET /items` |
| Carrinho e Checkout | API de Pedidos | Chamada | `POST /orders` |
| API de Pedidos | Cofre do Anão | Dependência direta | `import { charge }` |
| API de Pedidos | Livro de Registros | Consulta | `INSERT INTO orders …` |
| API de Pedidos | Fogão | Evento | publica `order.paid` |
| Fogão | Livro de Registros | Consulta | `UPDATE orders SET status …` |
| Cardápio, Carrinho e Checkout, API de Pedidos | Grimório | Dependência direta | `import { formatGold }` |

Os 4 tipos de Ligação aparecem. O caminho completo do clique em **Pagar** atravessa 4 Territórios:
Checkout → `POST /orders` → API de Pedidos → Cofre do Anão → Livro de Registros → evento `order.paid` → Fogão → Livro de Registros.

## Entradas por Classe

| Classe | Região de entrada | Por quê |
|---|---|---|
| Frontend | Cardápio | A primeira tela do usuário |
| Backend | API de Pedidos | A rota principal |
| Fullstack | Carrinho e Checkout | Tem a Ligação front ↔ back mais importante (`POST /orders`) |

## Slop plantado

| Slop | Onde | O que ensina |
|---|---|---|
| **Comentário mentiroso** (a isca da Contestação roteirizada) | `dwarfVault.ts`: `// charge() is idempotent: paying twice for the same order never double-charges` — o código não checa nada | Desconfiar de comentário; ler o código. O Desafio-isca tem o gabarito "nada acontece, é idempotente" |
| **Regra duplicada e divergente** | O total é calculado no front (`useCart.ts`, arredonda para cima) e na API (`service.ts`, não arredonda) — o cliente vê um preço e paga outro | Ligação front ↔ back; exatamente o slop que nasce quando cada lado é gerado separadamente |
| **Nome enganoso** | `validateOrder()` em `service.ts` também aplica o "imposto do rei" e muta o pedido | Ler o corpo, não o nome |
| **Código morto** | `applyCoupon()` em `api/src/orders/coupons.ts`, nunca chamado, com `// TODO: remove after the tavern festival` | Nem tudo que existe é usado; Apontar no código com distrator plausível |
| **Tratamento de erro engolido** | O worker do Fogão faz `catch {}` ao falhar o `UPDATE` — o pedido fica "pago" para sempre | O que acontece quando dá erro (Desafios de dificuldade alta) |

## Desafios de exemplo

**Múltipla escolha — Carrinho e Checkout (dificuldade 2)**
> Quando o Jogador clica em Pagar, qual rota da API é chamada?
> a) `POST /checkout` · b) **`POST /orders`** · c) `PUT /cart` · d) `POST /payments`
> Evidência: `web/src/pages/Checkout.tsx:42-48`.

**Apontar no código — API de Pedidos (dificuldade 3)**
> Em qual função o "imposto do rei" é aplicado?
> Opções: `routes/orders.ts → createOrderHandler` · **`orders/service.ts → validateOrder`** · `orders/coupons.ts → applyCoupon` · `shared/money.ts → formatGold`
> Evidência: `api/src/orders/service.ts:18-31`.

**Traçar o fluxo — API de Pedidos, região ainda não revelada (dificuldade 4)**
> Ordene o que acontece depois que `POST /orders` chega à API:
> 1. `createOrderHandler` recebe o pedido · 2. `validateOrder` aplica o imposto · 3. `charge()` cobra no Cofre do Anão · 4. **??? (Consulta → região desconhecida)** · 5. **??? (Evento → região desconhecida)**

**Isca — Cofre do Anão (dificuldade 3, `isca: true`)**
> O que acontece se o cliente clicar em Pagar duas vezes para o mesmo pedido?
> Gabarito (errado de propósito): "Nada — `charge()` é idempotente."
> Evidência apontada: o comentário em `dwarfVault.ts:3`. Ao contestar, o Jogo revela que nenhuma linha do código checa pedido repetido.

## Em aberto

1. **Idioma do código da Taverna**: inglês único (proposta acima) ou código localizado em pt/en/es?
2. Os nomes das Regiões e Territórios (Salão, Balcão, Adega, Cozinha, Cofre do Anão, Grimório, Livro de Registros, Fogão) são exibidos traduzidos na interface.
