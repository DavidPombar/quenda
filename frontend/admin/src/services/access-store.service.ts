// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AccessDay, CheckIn } from "@/types/models";
// The door device keeps the last synced day and the entries it could not send yet.
const dayKey = (slug: string) => `quenda.access.${slug}.day`;
const queueKey = (slug: string) => `quenda.access.${slug}.queue`;
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage full or disabled: the device keeps working from memory. */
  }
}
export function storedDay(slug: string) {
  return read<AccessDay | null>(dayKey(slug), null);
}
export function storeDay(slug: string, day: AccessDay) {
  write(dayKey(slug), day);
}
export function pendingCheckIns(slug: string) {
  return read<CheckIn[]>(queueKey(slug), []);
}
export function storePendingCheckIns(slug: string, items: CheckIn[]) {
  write(queueKey(slug), items);
}
