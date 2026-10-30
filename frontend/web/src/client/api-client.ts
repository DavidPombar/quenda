// SPDX-License-Identifier: AGPL-3.0-or-later
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}
/** The public website only reads public endpoints, so no session is needed. */
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/v2/${path}`, {
    credentials: "omit",
    headers: { "Accept-Language": document.documentElement.lang || "gl" },
  });
  if (!response.ok) throw new ApiError("request_failed", response.status);
  return response.json() as Promise<T>;
}
/** Fire-and-forget POST to a public endpoint (analytics); the custom header passes the CSRF check. */
async function send(path: string, body: unknown): Promise<void> {
  const response = await fetch(`/v2/${path}`, {
    method: "POST",
    credentials: "omit",
    keepalive: true,
    headers: { "Content-Type": "application/json", "X-Quenda-Request": "1" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new ApiError("request_failed", response.status);
}
export const apiClient = { request, send };
