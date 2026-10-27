// SPDX-License-Identifier: AGPL-3.0-or-later
/** Deployment settings for the OpenID Connect relying party, read once from the environment. */
export interface OidcConfig {
  publicUrl: string;
  issuer: string;
  /**
   * Where the API fetches the discovery document when it cannot reach the browser-facing issuer
   * (e.g. Compose: `http://keycloak:8080/realms/quenda` while the issuer is
   * `http://127.0.0.1:8081/realms/quenda`). The document must still declare `issuer`.
   */
  discoveryUrl: string | null;
  clientId: string;
  clientSecret: string | null;
  label: string;
  idpHint: string | null;
}
export const callbackPath = "/v2/public/auth/oidc/callback";
/** PUBLIC_URL without a trailing slash; the browser-facing origin (and optional prefix) of Quenda. */
export function publicUrl(env: NodeJS.ProcessEnv = process.env) {
  return (env.PUBLIC_URL ?? "").trim().replace(/\/+$/, "");
}
/** OIDC is enabled only when the issuer, the client id and PUBLIC_URL are all set. */
export function oidcConfig(env: NodeJS.ProcessEnv = process.env) {
  const issuer = env.OIDC_ISSUER?.trim();
  const clientId = env.OIDC_CLIENT_ID?.trim();
  const url = publicUrl(env);
  if (!issuer || !clientId || !url) return null;
  return {
    publicUrl: url,
    issuer,
    discoveryUrl: env.OIDC_DISCOVERY_URL?.trim() || null,
    clientId,
    clientSecret: env.OIDC_CLIENT_SECRET?.trim() || null,
    label: env.OIDC_LABEL?.trim() || "OpenID Connect",
    idpHint: env.OIDC_IDP_HINT?.trim() || null,
  } satisfies OidcConfig;
}
