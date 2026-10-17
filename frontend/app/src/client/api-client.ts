// SPDX-License-Identifier: AGPL-3.0-or-later
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
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
      "Accept-Language": localStorage.getItem("quenda.locale") ?? "gl",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => ({ code: "network", detail: "" }))) as {
      code: string;
      detail: string;
    };
    throw new ApiError(problem.code, problem.detail, response.status);
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
export const apiClient = { request };
