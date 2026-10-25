# Relatório de erro como issue do GitHub, aberta pelo Jogador

O spec (§8) pede um relatório de erro opcional, sanitizado e editável, e nenhuma telemetria no Jogo. Decidimos que o Jogo nunca envia o relatório: quando um erro do Mestre aparece (Nova Aventura ou preparação da Expedição), o Jogador pode pedir "Enviar relatório (opcional)"; o Jogo monta o texto já limpo (`sanitizar`/`detalhesDoErro` em `@quiz/jogo`), o Jogador o lê e edita, e "Abrir no GitHub" só abre o navegador em `https://github.com/Thyago331/quiz-your-slop/issues/new?title=…&body=…`. Quem envia é ele, na conta dele, depois de ver o texto mais uma vez.

Não há endpoint de relatório no servidor. Um endpoint seria tráfego automático do Jogo para fora (exatamente o que o spec proíbe), teria que guardar texto livre de terceiros e não deixaria o Jogador ver o destino. A URL é montada em Rust (`src-tauri/src/relatorio.rs`) a partir de um prefixo fixo; a interface só escolhe o título e o corpo, nunca o host.

A limpeza é por marcadores (`<projeto>/...`, `<projeto>`, `<caminho>`, `<nome>`, `<usuário>`, `<trecho de código>`, `"<texto>"`, `<url>`, `<email>`, `<segredo>`) e prefere apagar demais a de menos; o prompt e a saída do Mestre nunca entram, porque `detalhesDoErro` só lê campos conhecidos do erro. Os marcadores são os mesmos em todos os idiomas (o relatório vai para um repositório em português).

## Consequências

- O relatório exige uma conta no GitHub; sem ela, o Jogador pode copiar o texto do campo.
- Links do GitHub têm limite de tamanho: o corpo é cortado (com `[…]`) para a URL caber em 8.000 bytes.
