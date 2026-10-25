# Sync do desktop: fila de um envio só e XP do Jogador como contador

O Jogo desktop não depende do servidor para jogar (spec §10): o resumo de progresso (`montarEnvio`) sai pela camada Rust (`src-tauri/src/envio.rs`, com o token do chaveiro) ao abrir o Jogo, no fim de cada Expedição, ao entrar com o GitHub e, enquanto houver pendente, a cada 5 minutos. Sem rede, sem conta ou com o site fora do ar (5xx), o envio fica pendente.

A fila é um arquivo só (`<dados do app>/progresso/pendente.json`), não uma lista: o site junta pelo maior XP e estatísticas e, por Aventura, pelo último envio (`mesclarProgresso`), então o resumo mais novo já contém todos os anteriores. Cada tentativa lê o progresso do site (GET) e só envia (PUT) se há algo novo, para "O que é enviado" mostrar envios de verdade e não um a cada abertura.

O XP do Jogador é um contador, como no Tutorial do site: começa no maior entre a soma das Aventuras locais, o pendente e o último progresso que o site devolveu (`servidor.json`), e cada Expedição soma o que ganhou. Assim o XP do Tutorial (que mora no navegador) entra no Título do desktop e vice-versa, sem que o "maior vence" do servidor perca o de um dos lados. O desktop nunca envia a Aventura do Tutorial: o servidor guarda as Aventuras que não vieram num envio.

## Consequências

- Na primeira sincronia de quem já jogava nos dois lados antes disto, vale o maior dos dois XPs, não a soma.
- Um envio recusado pelo site (4xx) fica pendente e é tentado de novo; o próximo resumo o substitui.
