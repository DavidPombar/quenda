// SPDX-License-Identifier: AGPL-3.0-or-later
/** Hands a JSON document to the browser as a file download. */
export function saveJsonFile(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
