// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import * as client from "openid-client";
import {
  OidcClaims,
  OidcExchangeOutcome,
  OidcProvider,
} from "../../domain/oidc-provider";
import { OidcConfig, callbackPath, oidcConfig } from "./oidc-config";
const discoveryTimeoutSeconds = 10;
const discoveryAttempts = 3;
/**
 * Plain-HTTP issuers are accepted only for local development and tests: loopback addresses and
 * single-label hosts such as a Compose service name (`http://keycloak:8080`). Any other issuer must
 * use HTTPS, which openid-client enforces unless `allowInsecureRequests` is applied.
 */
export function isLocalHttpUrl(issuer: URL) {
  return (
    issuer.protocol === "http:" &&
    (["127.0.0.1", "localhost", "[::1]"].includes(issuer.hostname) ||
      /^[a-z0-9-]+$/i.test(issuer.hostname))
  );
}
function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    (error instanceof TypeError && /fetch/i.test(error.message))
  )
    return true;
  if (error instanceof client.ResponseBodyError) return error.status >= 500;
  return error.cause !== undefined && isNetworkFailure(error.cause);
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
@Injectable()
export class OpenIdOidcProvider
  extends OidcProvider
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(OidcProvider.name);
  private readonly config: OidcConfig | null = oidcConfig();
  private configuration: Promise<client.Configuration> | null = null;
  enabled() {
    return this.config !== null;
  }
  label() {
    return this.config?.label ?? null;
  }
  /** Warms the discovery cache without delaying start-up; failures are retried on first use. */
  onApplicationBootstrap() {
    if (this.config) void this.discover().catch(() => undefined);
  }
  async authorizationUrl(args: {
    state: string;
    nonce: string;
    codeVerifier: string;
  }) {
    const config = this.config;
    const configuration = await this.discover().catch(() => null);
    if (!config || !configuration) return null;
    const parameters: Record<string, string> = {
      redirect_uri: config.publicUrl + callbackPath,
      response_type: "code",
      response_mode: "query",
      scope: "openid profile email",
      state: args.state,
      nonce: args.nonce,
      code_challenge: createHash("sha256")
        .update(args.codeVerifier)
        .digest("base64url"),
      code_challenge_method: "S256",
    };
    if (config.idpHint) parameters.kc_idp_hint = config.idpHint;
    return client.buildAuthorizationUrl(configuration, parameters).href;
  }
  async exchange(args: {
    code: string;
    state: string;
    issuer: string | null;
    codeVerifier: string;
    nonce: string;
  }): Promise<OidcExchangeOutcome> {
    const config = this.config;
    if (!config) return { kind: "unavailable" };
    let configuration: client.Configuration;
    try {
      configuration = await this.discover();
    } catch {
      return { kind: "unavailable" };
    }
    // The state was already matched against the cookie and the stored attempt; it is rebuilt here
    // so that openid-client also checks it, together with the issuer (RFC 9207) when sent.
    const callback = new URL(config.publicUrl + callbackPath);
    callback.searchParams.set("code", args.code);
    callback.searchParams.set("state", args.state);
    if (args.issuer) callback.searchParams.set("iss", args.issuer);
    try {
      const tokens = await client.authorizationCodeGrant(
        configuration,
        callback,
        {
          pkceCodeVerifier: args.codeVerifier,
          expectedNonce: args.nonce,
          expectedState: args.state,
          idTokenExpected: true,
        },
      );
      const claims = tokens.claims();
      if (!claims) return { kind: "rejected" };
      return { kind: "ok", claims: this.claims(claims) };
    } catch (error) {
      if (isNetworkFailure(error)) {
        this.logger.warn("OIDC token endpoint unavailable");
        return { kind: "unavailable" };
      }
      this.logger.warn(
        `OIDC response rejected: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return { kind: "rejected" };
    }
  }
  private claims(token: client.IDToken): OidcClaims {
    const emailVerified = token.email_verified;
    return {
      issuer: token.iss,
      subject: token.sub,
      givenName: text(token.given_name),
      familyName: text(token.family_name),
      name: text(token.name),
      email: emailVerified === false ? null : text(token.email),
      nif: text(token.nif),
    };
  }
  /** Lazy, cached discovery. A failed lookup is retried a few times and then forgotten. */
  private discover() {
    const config = this.config;
    if (!config) return Promise.reject(new Error("OIDC is not configured"));
    this.configuration ??= this.fetchConfiguration(config).catch((error) => {
      this.configuration = null;
      this.logger.warn(
        `OIDC discovery failed for ${config.issuer}: ${error instanceof Error ? error.message : "unknown"}`,
      );
      throw error;
    });
    return this.configuration;
  }
  private async fetchConfiguration(config: OidcConfig) {
    const issuer = new URL(config.issuer);
    const discoveryUrl = config.discoveryUrl
      ? new URL(config.discoveryUrl)
      : null;
    const insecure =
      isLocalHttpUrl(issuer) ||
      (discoveryUrl !== null && isLocalHttpUrl(discoveryUrl));
    const execute = insecure ? [client.allowInsecureRequests] : [];
    const clientAuth = config.clientSecret ? undefined : client.None();
    let lastError: unknown;
    for (let attempt = 1; attempt <= discoveryAttempts; attempt++) {
      try {
        if (!discoveryUrl)
          return await client.discovery(
            issuer,
            config.clientId,
            config.clientSecret ?? undefined,
            clientAuth,
            { execute, timeout: discoveryTimeoutSeconds },
          );
        const configuration = new client.Configuration(
          await this.fetchMetadata(discoveryUrl, config.issuer),
          config.clientId,
          config.clientSecret ?? undefined,
          clientAuth,
        );
        for (const extension of execute) extension(configuration);
        return configuration;
      } catch (error) {
        lastError = error;
        if (attempt < discoveryAttempts) await sleep(250 * attempt);
      }
    }
    throw lastError;
  }
  /**
   * Discovery through a different (back-channel) URL. openid-client's `discovery()` requires the
   * document's issuer to equal the URL it fetched, so the metadata is fetched here and checked
   * against the configured OIDC_ISSUER instead; ID tokens are then validated against that issuer.
   */
  private async fetchMetadata(discoveryUrl: URL, expectedIssuer: string) {
    const url = discoveryUrl.pathname.endsWith(
      "/.well-known/openid-configuration",
    )
      ? discoveryUrl
      : new URL(
          `${discoveryUrl.pathname.replace(/\/+$/, "")}/.well-known/openid-configuration`,
          discoveryUrl,
        );
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(discoveryTimeoutSeconds * 1000),
    });
    if (!response.ok)
      throw new Error(`discovery answered HTTP ${response.status}`);
    const metadata = (await response.json()) as client.ServerMetadata;
    if (metadata.issuer !== expectedIssuer)
      throw new Error(
        `discovery issuer ${String(metadata.issuer)} differs from OIDC_ISSUER`,
      );
    return metadata;
  }
}
