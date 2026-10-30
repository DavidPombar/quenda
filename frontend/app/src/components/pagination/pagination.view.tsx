// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
// Numbered pages as links, so each page has its own URL and works with the keyboard and the back
// button; the current page is announced with aria-current.
export function Pagination({
  label,
  page,
  numbers,
  hrefFor,
  previousLabel,
  nextLabel,
  pageLabel,
}: {
  label: string;
  page: number;
  /** Pages to show; null marks a gap. */
  numbers: (number | null)[];
  hrefFor: (page: number) => string;
  previousLabel: string;
  nextLabel: string;
  pageLabel: (page: number) => string;
}) {
  const last = Math.max(...numbers.map((value) => value ?? 0));
  if (last <= 1) return null;
  return (
    <nav className="pagination" aria-label={label}>
      <ul>
        <li>
          {page > 1 ? (
            <Link to={hrefFor(page - 1)} rel="prev">
              <PiCaretLeft size={18} aria-hidden="true" />
              {previousLabel}
            </Link>
          ) : (
            <span className="pagination-disabled" aria-disabled="true">
              <PiCaretLeft size={18} aria-hidden="true" />
              {previousLabel}
            </span>
          )}
        </li>
        {numbers.map((value, index) =>
          value === null ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="pagination-gap"
            >
              …
            </li>
          ) : (
            <li key={value}>
              <Link
                to={hrefFor(value)}
                aria-label={pageLabel(value)}
                aria-current={value === page ? "page" : undefined}
              >
                {value}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < last ? (
            <Link to={hrefFor(page + 1)} rel="next">
              {nextLabel}
              <PiCaretRight size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span className="pagination-disabled" aria-disabled="true">
              {nextLabel}
              <PiCaretRight size={18} aria-hidden="true" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
