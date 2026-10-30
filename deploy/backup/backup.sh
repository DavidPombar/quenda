#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# One backup: a custom-format pg_dump streamed into restic, then old snapshots pruned.
#   docker compose -f deploy/compose.prod.yml exec backup backup.sh
set -eu -o pipefail
echo "$(date -Iseconds) backup started"
pg_dump --format=custom --no-owner \
  | restic backup --stdin --stdin-filename quenda.dump --tag quenda --host quenda
# shellcheck disable=SC2086 # BACKUP_KEEP holds several restic flags.
restic forget --tag quenda --prune ${BACKUP_KEEP}
restic check
echo "$(date -Iseconds) backup finished"
