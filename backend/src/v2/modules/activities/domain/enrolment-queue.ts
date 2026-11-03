// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Which people waiting move up when an activity has `places` and `enrolled` of them taken: the
 * oldest first, as many as fit. Pure, so every command that frees or adds places agrees (#97).
 */
export function promotions<
  T extends { createdAt: { epochNanoseconds: bigint } },
>(places: number, enrolled: number, waiting: readonly T[]): T[] {
  const free = Math.max(0, places - enrolled);
  return [...waiting]
    .sort((a, b) =>
      a.createdAt.epochNanoseconds < b.createdAt.epochNanoseconds
        ? -1
        : a.createdAt.epochNanoseconds > b.createdAt.epochNanoseconds
          ? 1
          : 0,
    )
    .slice(0, free);
}
