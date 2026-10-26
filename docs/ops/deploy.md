# Runbook: deploy do site na VPS

Spec §11: uma VPS (Hostinger), tudo em Docker, no padrão do `transito-analyzer`. O Nginx do host
termina o TLS para todos os sites da máquina; o Compose publica o site e o Umami só em portas de
loopback.

Testado localmente em 2026-10-26: a imagem, o Compose com o override (as quatro peças saudáveis,
migrações aplicadas na subida), o backup e a restauração da seção 8 e o smoke de produção contra
o stack local. O DNS, o Nginx, o Certbot e o workflow no GitHub dependem do domínio e da VPS e
ainda não foram exercitados.

O que roda (`deploy/docker-compose.yml`, projeto `quiz`):

| Serviço    | Imagem                                    | Papel                                                   | Volume          |
| ---------- | ----------------------------------------- | ------------------------------------------------------- | --------------- |
| `app`      | `ghcr.io/thyago331/quiz-your-slop-site`   | Next.js standalone; aplica as migrações ao subir        | —               |
| `db`       | `postgres:17-alpine`                      | contas, lista de espera, progresso, tokens do desktop   | `quiz_db`       |
| `umami`    | `ghcr.io/umami-software/umami:3.4.0`      | estatísticas, `SALT_ROTATION=day`                       | —               |
| `umami-db` | `postgres:17-alpine`                      | o banco do Umami                                        | `quiz_umami_db` |

Portas no host (override `docker-compose.override.host-nginx.yml`):

| Serviço | Porta              | Nginx                        |
| ------- | ------------------ | ---------------------------- |
| `app`   | `127.0.0.1:3101`   | `https://<domínio>`          |
| `umami` | `127.0.0.1:3102`   | `https://stats.<domínio>`    |

3101/3102 porque o `transito-analyzer`, na mesma VPS, já usa 3001/3002. Os dois Postgres ficam
numa rede interna do Compose, sem porta publicada.

## 1. O que configurar no GitHub

Em **Settings → Environments → `production`** (o workflow de deploy usa esse ambiente):

| Tipo     | Nome             | Valor                                                      |
| -------- | ---------------- | ---------------------------------------------------------- |
| variável | `SITE_URL`       | `https://<domínio>` (sem barra no fim)                     |
| segredo  | `DEPLOY_HOST`    | o IP ou nome da VPS                                        |
| segredo  | `DEPLOY_USER`    | `deploy`                                                   |
| segredo  | `DEPLOY_SSH_KEY` | a chave privada do par da seção 2, passo 2                 |
| segredo  | `DEPLOY_PATH`    | `/opt/quiz`                                                |

Para a release do desktop (`.github/workflows/release.yml`, no nível do repositório):

| Tipo     | Nome                                 | Valor                                                       |
| -------- | ------------------------------------ | ----------------------------------------------------------- |
| variável | `QUIZ_SITE_URL`                      | `https://<domínio>` (fixada no binário para o login)        |
| segredo  | `TAURI_SIGNING_PRIVATE_KEY`          | a chave privada do updater                                  |
| segredo  | `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | a senha dela                                                |

## 2. Primeira vez na VPS

1. DNS: registros `A` (e `AAAA`, se houver IPv6) para `<domínio>` e `stats.<domínio>` apontando
   para a VPS.
2. Usuário e pasta (se a VPS já roda o `transito-analyzer`, o usuário `deploy` e o Docker já
   existem; pule o que já estiver feito):

   ```sh
   sudo adduser --disabled-password --gecos '' deploy && sudo usermod -aG docker deploy
   sudo mkdir -p /opt/quiz && sudo chown deploy:deploy /opt/quiz
   ```

   A parte pública de um par de chaves SSH dedicado vai em `/home/deploy/.ssh/authorized_keys`;
   a privada vira o segredo `DEPLOY_SSH_KEY`.
3. Copie o stack deste repositório:

   ```sh
   scp deploy/docker-compose.yml deploy/docker-compose.override.host-nginx.yml \
     deploy/.env.example deploy/app.env.example deploy@<vps>:/opt/quiz/
   ```

   Na VPS:

   ```sh
   cd /opt/quiz
   mv docker-compose.override.host-nginx.yml docker-compose.override.yml
   cp .env.example .env && cp app.env.example app.env && chmod 600 .env app.env
   ```

   O nome `docker-compose.override.yml` faz o Compose juntar o override em todo `docker compose
   up`, inclusive no do workflow (que roda sem `-f`). Equivale a
   `docker compose -f docker-compose.yml -f docker-compose.override.host-nginx.yml up -d`, mas
   sem depender de lembrar dos `-f`.
4. Preencha:
   - `.env` (lido pelo Compose): `DB_PASSWORD`, `UMAMI_DB_PASSWORD`, `UMAMI_APP_SECRET`
     (`openssl rand -hex 32` cada). `APP_TAG=latest`.
   - `app.env` (o site): `AUTH_SECRET` (`openssl rand -base64 33`), `AUTH_GITHUB_ID` e
     `AUTH_GITHUB_SECRET` (seção 5), `AUTH_URL` e `SITE_URL` = `https://<domínio>`,
     `UMAMI_SCRIPT_URL=https://stats.<domínio>/script.js`, `UMAMI_WEBSITE_ID` vazio até a seção 4,
     `DONO_GITHUB_ID`. O `DATABASE_URL` não vai aqui: o Compose monta com o `DB_PASSWORD`.
5. Login no GHCR, uma vez (para `pull` e rollback à mão; o workflow usa o próprio token): um
   token clássico com `read:packages` em <https://github.com/settings/tokens>, e como `deploy`:

   ```sh
   echo <token> | docker login ghcr.io -u Thyago331 --password-stdin
   ```

6. Suba (como `deploy`, em `/opt/quiz`): `docker compose up -d`. A imagem só existe no GHCR
   depois do primeiro run do workflow de deploy; antes disso, dispare-o pela aba Actions (o passo
   de SSH falha se a VPS ainda não estiver pronta, mas a imagem fica publicada).
7. Confira: `curl -fsS http://127.0.0.1:3101/api/health` → `{"status":"ok"}`;
   `docker compose logs app` mostra `migrações aplicadas: …` na primeira subida;
   `curl -fsS http://127.0.0.1:3102/api/heartbeat` → `{"ok":true}`.

## 3. Nginx do host e TLS

Um arquivo por nome em `/etc/nginx/sites-available/`, com link em `sites-enabled/`.

`/etc/nginx/sites-available/<domínio>`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name <domínio>;

    location / {
        proxy_pass http://127.0.0.1:3101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

`/etc/nginx/sites-available/stats.<domínio>`: igual, com `server_name stats.<domínio>;` e
`proxy_pass http://127.0.0.1:3102;`.

O `$connection_upgrade` precisa do `map` no bloco `http` (em `/etc/nginx/conf.d/upgrade.conf`,
se ainda não existir por causa de outro site):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

Depois:

```sh
sudo ln -s /etc/nginx/sites-available/<domínio> /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/stats.<domínio> /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d <domínio> -d stats.<domínio>
```

O Certbot acrescenta o `server` 443 e o redirecionamento HTTP→HTTPS; o `certbot.timer` renova.
O `Host` e o `X-Forwarded-*` importam: o Auth.js monta o callback do login a partir deles (o
`AUTH_URL` no `app.env` fixa a origem de qualquer jeito), e o Umami lê o IP do visitante do
`X-Forwarded-For` (o gateway da rede do Docker está em `TRUSTED_PROXIES`).

Docker e ufw: portas publicadas passam por fora do ufw. Por isso o override publica só em
`127.0.0.1`; o caminho de fora é o Nginx.

## 4. Umami

1. Abra `https://stats.<domínio>`, entre com `admin` / `umami` e troque a senha na hora
   (Settings → Profile).
2. Settings → Websites → Add website: nome `Quiz your slop`, domínio `<domínio>`. Copie o
   Website ID.
3. No `app.env`: `UMAMI_WEBSITE_ID=<id>` e `UMAMI_SCRIPT_URL=https://stats.<domínio>/script.js`;
   depois `docker compose up -d app`.
4. Confira no tempo real do Umami que uma visita de fora aparece, com país.

`SALT_ROTATION=day` está no Compose e é prometido pela página de privacidade: não mude um sem o
outro. Atualizar o Umami: troque a tag fixada no `docker-compose.yml` (aqui e na VPS), depois
`docker compose pull umami && docker compose up -d umami` (as migrações dele rodam ao subir).

## 5. OAuth App de produção no GitHub

Em <https://github.com/settings/developers> → New OAuth App (uma separada da de
desenvolvimento):

- Homepage URL: `https://<domínio>`
- Authorization callback URL: `https://<domínio>/api/auth/callback/github`

Copie o Client ID para `AUTH_GITHUB_ID`, gere um Client secret para `AUTH_GITHUB_SECRET`, e
`docker compose up -d app`. O login pede só `read:user user:email` (o smoke confere).

## 6. Deploy pelo GitHub Actions

`.github/workflows/deploy.yml` roda quando a CI passa na `main` (ou à mão, pela aba Actions):

1. monta a imagem com o `Dockerfile` da raiz e publica `latest` e `sha-<commit>` no GHCR;
2. por SSH, em `DEPLOY_PATH`: login no GHCR com o token do job num config descartável,
   `docker compose pull && docker compose up -d --remove-orphans` (atualiza também Postgres e
   Umami dentro das tags fixadas), espera `SITE_URL/api/health` por até 60 s e limpa imagens
   soltas;
3. o job `smoke` roda `apps/site/e2e/producao.spec.ts` contra `SITE_URL`: `/api/health`, `/pt`
   com título, `sitemap.xml` e `robots.txt` apontando para o domínio, e o botão de entrar levando
   ao authorize do GitHub com o escopo mínimo e o callback do domínio.

À mão, da raiz do repositório depois de `pnpm install`:

```sh
pnpm --filter @quiz/site exec playwright install chromium
PRODUCTION_URL=https://<domínio> pnpm --filter @quiz/site e2e:producao
```

Os dois jobs usam o ambiente `production`; uma regra de aprovação nele pede aprovação duas vezes.

## 7. Rollback

Em `/opt/quiz`, fixe a versão anterior no `.env`:

```sh
sed -i 's/^APP_TAG=.*/APP_TAG=sha-<commit anterior>/' .env
docker compose up -d app
```

As tags `sha-*` estão em <https://github.com/Thyago331/quiz-your-slop/pkgs/container/quiz-your-slop-site>.
Com o `APP_TAG` fixado, o próximo deploy publica a imagem nova mas a VPS continua na fixada:
volte para `APP_TAG=latest` quando o problema estiver resolvido. As migrações só acrescentam;
uma imagem anterior roda sobre o banco já migrado desde que nenhuma migração tenha removido algo
de que ela dependa.

## 8. Backup do Postgres

`pg_dump` diário do banco das contas, guardando 14 dias (crontab do `deploy`, `crontab -e`):

```cron
15 3 * * * cd /opt/quiz && mkdir -p backups && docker compose exec -T db pg_dump -U quiz quiz | gzip > backups/quiz-$(date +\%F).sql.gz && find backups -name 'quiz-*.sql.gz' -mtime +14 -delete
```

O do Umami, se o histórico importar: o mesmo com `umami-db`, `-U umami umami` e `umami-*.sql.gz`.
Copie a pasta `backups` para fora da VPS de vez em quando (o backup da Hostinger, `rsync` para
outra máquina).

Restaurar num banco vazio:

```sh
docker compose stop app
docker compose exec -T db psql -U quiz -d postgres -c 'DROP DATABASE quiz' -c 'CREATE DATABASE quiz OWNER quiz'
gunzip -c backups/quiz-<data>.sql.gz | docker compose exec -T db psql -U quiz quiz
docker compose start app
```

## 9. Dia a dia

- Logs: `docker compose logs -f app` (ou `umami`, `db`).
- Mudar uma variável: edite `app.env` (o site) ou `.env` (Compose), depois
  `docker compose up -d app`.
- Operar como outro usuário: a pasta é do `deploy`, então
  `sudo -u deploy docker compose --project-directory /opt/quiz <comando>`.
- Disco: `docker system df`; o deploy limpa imagens soltas.
- Postgres: versões menores chegam com `docker compose pull`; trocar a maior (17 → 18) exige
  dump e restore.
