// SPDX-License-Identifier: AGPL-3.0-or-later
import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { publicUrl } from "../../oidc/oidc-config";
import { citizenHome } from "../../../domain/sign-in-target";
import { ErrorCode } from "../../../../../shared/application/errors";
import { OPERATOR_COOKIE } from "../../../../../shared/infrastructure/api/operator.guard";
// Secure by default in production; only the loopback HTTP demo opts out (COOKIE_SECURE=false).
const secure = () =>
  process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE !== "false"
    : process.env.NODE_ENV === "production";
/** The 8-hour API session; SameSite=Strict, so it never travels on cross-site navigations. */
export function setSessionCookie(response: Response, token: string) {
  response.cookie("quenda_session", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: secure(),
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}
/** The operator's 8-hour session (#18), with the same flags as the municipal one. */
export function setOperatorCookie(response: Response, token: string) {
  response.cookie(OPERATOR_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: secure(),
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
}
/**
 * Binds an OIDC attempt to the browser that started it. SameSite=Lax because the identity
 * provider brings the person back with a top-level cross-site GET, and scoped to the auth routes.
 */
const loginCookie = {
  name: "quenda_login",
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/v2/public/auth",
  },
};
export function setLoginCookie(response: Response, state: string) {
  response.cookie(loginCookie.name, state, {
    ...loginCookie.options,
    secure: secure(),
    maxAge: 10 * 60 * 1000,
  });
}
export function clearLoginCookie(response: Response) {
  response.clearCookie(loginCookie.name, {
    ...loginCookie.options,
    secure: secure(),
  });
}
export function loginCookieMatches(request: Request, state: string) {
  const expected = request.headers.cookie
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${loginCookie.name}=`))
    ?.slice(loginCookie.name.length + 1);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(state);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Absolute URL in the citizen app (relative when PUBLIC_URL is not configured). */
export function appUrl(path: string) {
  return publicUrl() + path;
}
/** Sign-in failures go back to the citizen app, which shows the `authError` notice. */
export function authErrorUrl(slug: string | null, code: ErrorCode) {
  return appUrl(
    `${slug ? citizenHome(slug) : "/app/"}?authError=${encodeURIComponent(code)}`,
  );
}
