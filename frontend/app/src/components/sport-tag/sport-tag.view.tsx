// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Sport } from "@/types/models";
// Sport surface colour with a court-line bar; the label is always text.
export function SportTag({ sport, label }: { sport: Sport; label: string }) {
  return <span className={`sport-tag sport-${sport}`}>{label}</span>;
}
