// SPDX-License-Identifier: AGPL-3.0-or-later
import type { SportArt } from "@/types/models";
// Sport surface colour with a court-line bar; the label is always text.
export function SportTag({ art, label }: { art: SportArt; label: string }) {
  return <span className={`sport-tag sport-${art}`}>{label}</span>;
}
