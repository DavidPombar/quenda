// SPDX-License-Identifier: AGPL-3.0-or-later
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}
/** The public website only reads public endpoints, so no session or CSRF header is needed. */
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/v2/${path}`, {
    credentials: "omit",
    headers: { "Accept-Language": document.documentElement.lang || "gl" },
  });
  if (!response.ok) throw new ApiError("request_failed", response.status);
  return response.json() as Promise<T>;
}
export const apiClient = { request };
