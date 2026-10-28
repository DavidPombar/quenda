// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Slot } from "@/types/models";
/**
 * Every court of a facility in one accessible table: rows are courts (parts
 * indented under their composite), columns are start times.
 */
export function ResourceGrid(p: {
  caption: string;
  resourceHeader: string;
  outOfService: string;
  columns: { start: string; label: string }[];
  rows: {
    id: string;
    name: string;
    parentName?: string;
    active: boolean;
    cells: {
      start: string;
      slot?: Slot;
      status: string;
      label: string;
      select: () => void;
    }[];
  }[];
}) {
  return (
    <div
      className="resource-grid"
      role="region"
      aria-label={p.caption}
      tabIndex={0}
    >
      <table>
        <caption className="sr-only">{p.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{p.resourceHeader}</th>
            {p.columns.map((column) => (
              <th scope="col" key={column.start}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {p.rows.map((row) => (
            <tr key={row.id}>
              <th
                scope="row"
                className={row.parentName ? "resource-part" : undefined}
              >
                {row.parentName && (
                  <span className="sr-only">{row.parentName} › </span>
                )}
                {row.name}
              </th>
              {row.active ? (
                row.cells.map((cell) => (
                  <td key={cell.start}>
                    {cell.slot && (
                      <button
                        type="button"
                        className={`time-slot grid-slot ${cell.slot.status}`}
                        aria-label={cell.label}
                        disabled={cell.slot.status !== "available"}
                        onClick={cell.select}
                      >
                        <span>{cell.status}</span>
                      </button>
                    )}
                  </td>
                ))
              ) : (
                <td colSpan={Math.max(p.columns.length, 1)}>
                  <span className="out-of-service">{p.outOfService}</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
