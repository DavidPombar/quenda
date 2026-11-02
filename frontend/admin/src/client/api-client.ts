// SPDX-License-Identifier: AGPL-3.0-or-later
import { SESSION_ENDED_EVENT } from "@/constants/events";
export class ApiError extends Error {
  /** `problem` is the whole problem document, extension members included (RFC 9457). */
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly problem: Record<string, unknown> = {},
  ) {
    super(message);
  }
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/v2/${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-Quenda-Request": "1",
      // The shell keeps <html lang> on the chosen or the municipality's default language.
      "Accept-Language":
        localStorage.getItem("quenda.locale") ??
        (document.documentElement.lang || "gl"),
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("public/"))
      window.dispatchEvent(new Event(SESSION_ENDED_EVENT));
    const problem = (await response
      .json()
      .catch(() => ({ code: "network", detail: "" }))) as {
      code: string;
      detail: string;
    } & Record<string, unknown>;
    throw new ApiError(problem.code, problem.detail, response.status, problem);
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
export const apiClient = { request };
