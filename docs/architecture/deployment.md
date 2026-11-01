# Deployment on one server

`deploy/server` runs a whole instance on one Linux server with Docker: PostgreSQL, the API, the
delivery worker, the web container and Caddy, which obtains and renews the HTTPS certificate. It
is the same setup for a council's own server and for any provider; nothing in it depends on one.

## Requirements

- A server with Docker and Compose v2 (Ubuntu 24.04 or Debian 12/13) with at least 2 GB of RAM;
  one vCPU is enough for a demo or a small pilot. The images are built on the server, and
  `install.sh` adds a 4 GB swap file for that.
- A public name pointing at the server (A and AAAA records). Without a domain of your own,
  `<ip-with-dashes>.sslip.io` resolves to the IP and works with Let's Encrypt.
- Ports 22, 80 and 443 (TCP, and 443/UDP for HTTP/3) open, and nothing else.
- For a real instance, an SMTP provider on port 587 for notices and sign-in codes.

## Install

As root on the server:

```sh
git clone https://github.com/DavidPombar/quenda.git /opt/quenda
cd /opt/quenda
QUENDA_DOMAIN=reservas.example.gal SMTP_URL=smtp://user:pass@smtp.example:587 \
  MAIL_FROM=reservas@example.gal sh deploy/server/install.sh
```

`install.sh`:

- adds the swap file, installs automatic security updates and allows SSH by key only;
- writes `deploy/server/.env` (readable only by root) with new secrets, unless it exists already;
- installs `/etc/cron.d/quenda`, which runs the retention job every night at 03:15 and dumps
  the database to `/var/backups/quenda` at 02:45, keeping 14 days;
- builds the images and starts the containers.

**Keep a copy of `.env` outside the server.** Without `QUENDA_DATA_KEY` the encrypted data
(NIF, second factor of staff accounts) cannot be read, and the backups need it too. The dumps
stay on the same server; copy them elsewhere (for example an object storage bucket) for real
backups.

`DEMO_MODE=true` starts a public demonstration with synthetic municipalities and accounts
instead. Sign-in by email is off there, because no one could read the codes.

## First accounts

```sh
cd /opt/quenda/deploy/server
docker compose exec api node backend/dist/database/staff.js create --operator --login operacion --name "Deputación · operación"
```

It prints a temporary password once. See "First accounts in production" in the README.

## Update

```sh
cd /opt/quenda && git pull && cd deploy/server && docker compose up -d --build --wait
```

Migrations run when the API starts. Before an update, take a dump:
`docker compose exec -T db pg_dump -U quenda -Fc quenda > before-update.dump`.

## Restore

```sh
docker compose exec -T db pg_restore -U quenda -d quenda --clean --if-exists < quenda-2026-11-01.dump
```

## Hetzner Cloud from the command line

The reference demo runs on a Hetzner CPX12 (Nuremberg) created with `hcloud`:

```sh
hcloud ssh-key create --name me --public-key-from-file ~/.ssh/id_ed25519.pub
hcloud firewall create --name quenda-web
hcloud firewall add-rule quenda-web --direction in --protocol tcp --port 22 --source-ips 0.0.0.0/0 --source-ips ::/0
hcloud firewall add-rule quenda-web --direction in --protocol tcp --port 80 --source-ips 0.0.0.0/0 --source-ips ::/0
hcloud firewall add-rule quenda-web --direction in --protocol tcp --port 443 --source-ips 0.0.0.0/0 --source-ips ::/0
hcloud firewall add-rule quenda-web --direction in --protocol udp --port 443 --source-ips 0.0.0.0/0 --source-ips ::/0
hcloud server create --name quenda --type cpx12 --image docker-ce --location nbg1 --ssh-key me --firewall quenda-web
```

Hetzner blocks outgoing ports 25 and 465 on new servers, so mail goes through a provider on 587.
