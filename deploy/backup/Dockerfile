# SPDX-License-Identifier: AGPL-3.0-or-later
# Scheduled backups (#27): pg_dump of the same major version as the database, piped into
# restic (BSD-2-Clause), which encrypts, deduplicates and stores it locally, over SFTP or in S3.
FROM postgres:17-alpine
RUN apk add --no-cache restic openssh-client tzdata
COPY backup.sh restore.sh entrypoint.sh /usr/local/bin/
ENTRYPOINT ["entrypoint.sh"]
