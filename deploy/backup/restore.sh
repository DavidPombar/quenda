#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Restores a snapshot (default: the latest) into the database, replacing what is there.
# Stop api and worker first: docs/operacion/copias-de-seguridad.md.
#   docker compose -f deploy/compose.prod.yml exec backup restore.sh [snapshot-id] [database]
set -eu -o pipefail
snapshot="${1:-latest}"
database="${2:-$PGDATABASE}"
echo "Restoring snapshot ${snapshot} into ${database}"
restic dump --tag quenda "${snapshot}" quenda.dump \
  | pg_restore --clean --if-exists --no-owner --single-transaction --exit-on-error -d "${database}"
echo "Restore finished"
