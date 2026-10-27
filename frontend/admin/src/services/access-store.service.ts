// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AccessKeys } from "@/types/models";
/** A scan validated offline, waiting to be recorded when the phone is back online. */
export interface QueuedScan {
  token: string;
  scannedAt: string;
}
// Storage can be unavailable (private mode, blocked site data); the scanner then works online only.
function read<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Nothing to keep. */
  }
}
const keysKey = (tenantId: string) => `quenda.access.keys.${tenantId}`;
const queueKey = (tenantId: string) => `quenda.access.queue.${tenantId}`;
export function cachedKeys(tenantId: string) {
  return read<AccessKeys>(keysKey(tenantId));
}
export function rememberKeys(tenantId: string, keys: AccessKeys) {
  write(keysKey(tenantId), keys);
  return keys;
}
export function queuedScans(tenantId: string) {
  return read<QueuedScan[]>(queueKey(tenantId)) ?? [];
}
export function queueScan(tenantId: string, scan: QueuedScan) {
  const queue = queuedScans(tenantId).filter(
    (item) => item.token !== scan.token,
  );
  write(queueKey(tenantId), [...queue, scan]);
}
export function dropScan(tenantId: string, token: string) {
  write(
    queueKey(tenantId),
    queuedScans(tenantId).filter((item) => item.token !== token),
  );
}
