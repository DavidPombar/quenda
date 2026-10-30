#!/bin/sh
# SPDX-License-Identifier: AGPL-3.0-or-later
# Creates the restic repository on first start and runs backup.sh on BACKUP_SCHEDULE (cron syntax).
set -eu
restic cat config >/dev/null 2>&1 || restic init
echo "${BACKUP_SCHEDULE} /usr/local/bin/backup.sh >/proc/1/fd/1 2>/proc/1/fd/2" | crontab -
echo "Backups scheduled: ${BACKUP_SCHEDULE} (${TZ:-UTC})"
exec crond -f -l 8
