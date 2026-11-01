#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Installs Quenda on a Linux server with Docker from a checkout of the repository (for example
# /opt/quenda), using deploy/compose.prod.yml. Run as root:
#
#   QUENDA_DOMAIN=reservas.concello.gal \
#     SMTP_URL=smtp://user:pass@smtp.example:587 MAIL_FROM=reservas@concello.gal \
#     sh deploy/install.sh
#
# Optional: DEMO_MODE=true for a public demonstration, DEPLOYMENT_TIMEZONE, RESTIC_REPOSITORY,
# BACKUP_DIR. It can be run again: existing settings files are kept and the containers are
# rebuilt and restarted. Guide: docs/operacion/despliegue-concello.md.
set -eu
cd "$(dirname "$0")"
DEPLOY_DIR=$(pwd)

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Engine with the Compose plugin is required (docs/operacion/despliegue-concello.md)." >&2
  exit 1
fi

# Server preparation: only as root on Linux, so the script can also be tried on a workstation.
if [ "$(id -u)" = 0 ] && [ "$(uname -s)" = Linux ]; then
  # Swap: building the images needs more memory than a 2 GB server has.
  mem_kb=$(awk '/^MemTotal:/ { print $2 }' /proc/meminfo)
  if [ -z "$(swapon --noheadings 2>/dev/null)" ] && [ "$mem_kb" -lt 4000000 ]; then
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    echo "/swapfile none swap sw 0 0" >>/etc/fstab
  fi
  if command -v apt-get >/dev/null 2>&1; then
    DEBIAN_FRONTEND=noninteractive apt-get -qq update
    DEBIAN_FRONTEND=noninteractive apt-get -qq install -y unattended-upgrades >/dev/null
  fi
  # SSH by key only, unless that would lock out an administrator who has no key yet.
  if [ -d /etc/ssh/sshd_config.d ]; then
    if [ -s /root/.ssh/authorized_keys ]; then
      printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\n' >/etc/ssh/sshd_config.d/10-quenda.conf
      systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
    else
      echo "No SSH key in /root/.ssh/authorized_keys: password sign-in to SSH stays on." >&2
    fi
  fi
else
  echo "Not root on Linux: skipping swap, security updates and SSH settings."
fi

umask 077
if [ ! -f .env ]; then
  : "${QUENDA_DOMAIN:?Set QUENDA_DOMAIN to the public name of the instance}"
  {
    echo "QUENDA_DOMAIN=$QUENDA_DOMAIN"
    echo "COMPOSE_PROFILES=caddy"
    echo "DEPLOYMENT_TIMEZONE=${DEPLOYMENT_TIMEZONE:-Europe/Madrid}"
    echo "DEMO_MODE=${DEMO_MODE:-false}"
    echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
    echo "RESTIC_PASSWORD=$(openssl rand -base64 32)"
    [ -n "${RESTIC_REPOSITORY:-}" ] && echo "RESTIC_REPOSITORY=$RESTIC_REPOSITORY"
    [ -n "${BACKUP_DIR:-}" ] && echo "BACKUP_DIR=$BACKUP_DIR"
    true
  } >.env
  echo "Wrote $DEPLOY_DIR/.env (domain, database and backups)."
fi
if [ ! -f quenda.env ]; then
  {
    echo "ACCESS_KEY_SECRET=$(openssl rand -hex 32)"
    echo "UNSUBSCRIBE_SECRET=$(openssl rand -hex 32)"
    echo "QUENDA_DATA_KEY=$(openssl rand -base64 32)"
    [ -n "${SMTP_URL:-}" ] && echo "SMTP_URL=$SMTP_URL"
    [ -n "${MAIL_FROM:-}" ] && echo "MAIL_FROM=$MAIL_FROM"
    # A public demo has no mailbox anyone could read, so sign-in by email stays off there.
    [ "${DEMO_MODE:-false}" = true ] && echo "EMAIL_LOGIN=false"
    true
  } >quenda.env
  echo "Wrote $DEPLOY_DIR/quenda.env (application secrets)."
fi

cd ..
docker compose -f deploy/compose.prod.yml up -d --build --wait
domain=$(grep '^QUENDA_DOMAIN=' deploy/.env | cut -d= -f2)
cat <<EOF
Quenda is running at https://$domain/
Keep a copy of deploy/.env and deploy/quenda.env outside this server: without RESTIC_PASSWORD no
backup can be read, and without QUENDA_DATA_KEY the encrypted data cannot be read.
Next: create the first operator account (docs/operacion/alta-concello.md).
EOF
