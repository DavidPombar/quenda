// SPDX-License-Identifier: AGPL-3.0-or-later
import bookings from "@/assets/illustrations/empty-bookings.svg";
import search from "@/assets/illustrations/empty-search.svg";
import error from "@/assets/illustrations/empty-error.svg";
import access from "@/assets/illustrations/empty-access.svg";
const ART = { bookings, search, error, access };
// Decorative spot illustration for empty and error states.
export function SpotArt({
  kind,
  size = "md",
}: {
  kind: keyof typeof ART;
  size?: "sm" | "md";
}) {
  return (
    <img
      className={`spot-art spot-art-${size}`}
      src={ART[kind]}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
