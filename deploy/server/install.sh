#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Prepares a fresh Ubuntu or Debian server with Docker and starts Quenda from deploy/server.
# Run as root inside a checkout of the repository (for example /opt/quenda):
#
#   QUENDA_DOMAIN=reservas.example.gal [DEMO_MODE=true] sh deploy/server/install.sh
#
# It can be run again: it keeps an existing .env and only rebuilds and restarts the containers.
set -eu
cd "$(dirname "$0")"
SERVER_DIR=$(pwd)
REPO_DIR=$(cd ../.. && pwd)

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed (Hetzner's 'docker-ce' image includes it)." >&2
  exit 1
fi

# Swap: building the images needs more memory than a 2 GB server has.
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >>/etc/fstab
fi

# Security updates, and SSH by key only.
DEBIAN_FRONTEND=noninteractive apt-get -qq update
DEBIAN_FRONTEND=noninteractive apt-get -qq install -y unattended-upgrades >/dev/null
printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\n' >/etc/ssh/sshd_config.d/10-quenda.conf
systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true

if [ ! -f .env ]; then
  : "${QUENDA_DOMAIN:?Set QUENDA_DOMAIN}"
  # A public demo has no mailbox anyone could read, so sign-in by email stays off there.
  [ "${DEMO_MODE:-false}" = true ] && EMAIL_LOGIN=${EMAIL_LOGIN:-false}
  umask 077
  cat >.env <<EOF
QUENDA_DOMAIN=$QUENDA_DOMAIN
DEMO_MODE=${DEMO_MODE:-false}
POSTGRES_PASSWORD=$(openssl rand -hex 24)
QUENDA_DATA_KEY=$(openssl rand -base64 32)
ACCESS_KEY_SECRET=$(openssl rand -hex 32)
UNSUBSCRIBE_SECRET=$(openssl rand -hex 32)
SMTP_URL=${SMTP_URL:-}
MAIL_FROM=${MAIL_FROM:-}
EMAIL_LOGIN=${EMAIL_LOGIN:-}
EOF
  echo "Wrote $SERVER_DIR/.env with new secrets. Back it up: without QUENDA_DATA_KEY the encrypted data cannot be read."
fi

# Daily retention (npm run db:retention) and a nightly database dump kept for 14 days.
mkdir -p /var/backups/quenda
cat >/etc/cron.d/quenda <<EOF
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
15 3 * * * root cd $SERVER_DIR && docker compose exec -T api node backend/dist/database/retention.js >>/var/log/quenda-retention.log 2>&1
45 2 * * * root cd $SERVER_DIR && docker compose exec -T db pg_dump -U quenda -Fc quenda >/var/backups/quenda/quenda-\$(date +\%F).dump && find /var/backups/quenda -name '*.dump' -mtime +14 -delete
EOF

cd "$SERVER_DIR"
docker compose build
docker compose up -d --wait
echo "Quenda is running at https://$(grep '^QUENDA_DOMAIN=' .env | cut -d= -f2) (from $REPO_DIR)."
