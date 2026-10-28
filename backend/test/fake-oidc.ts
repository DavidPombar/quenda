// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, randomBytes } from "node:crypto";
import { createServer, IncomingMessage, Server } from "node:http";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
type Mode = "ok" | "access_denied" | "wrong_nonce";
interface Grant {
  challenge: string;
  nonce: string;
  redirectUri: string;
  claims: Record<string, unknown>;
}
async function body(request: IncomingMessage) {
  let text = "";
  for await (const chunk of request) text += chunk;
  return new URLSearchParams(text);
}
/**
 * Minimal in-process OpenID Connect provider for e2e tests: discovery, JWKS, an /authorize that
 * redirects straight back (no login page) and a /token that checks PKCE and signs an ES256 ID
 * token. `issuer` may differ from the URL it is served on, to mimic a back-channel discovery URL.
 */
export class FakeOidc {
  readonly clientId = "quenda-test";
  readonly clientSecret = randomBytes(16).toString("hex");
  /** Claims of the next sign-in, beyond iss/aud/nonce/iat/exp. */
  claims: Record<string, unknown> = {};
  mode: Mode = "ok";
  /** The redirect_uri the client is registered with (set once the app's URL is known). */
  redirectUri = "";
  /** Query of the last /authorize request, for assertions (e.g. kc_idp_hint). */
  lastAuthorize: URLSearchParams | null = null;
  authorizeCount = 0;
  private readonly grants = new Map<string, Grant>();
  private server: Server | null = null;
  private keys: Awaited<ReturnType<typeof generateKeyPair>> | null = null;
  private servedAt = "";
  private claimedIssuer: string | null = null;
  /** URL the provider is actually reachable at (its discovery base). */
  get url() {
    return this.servedAt;
  }
  get issuer() {
    return this.claimedIssuer ?? this.servedAt;
  }
  /** Starts listening; `issuer` overrides the issuer declared in discovery and ID tokens. */
  async start(options: { issuer?: string } = {}) {
    this.keys = await generateKeyPair("ES256");
    this.server = createServer((request, response) => {
      this.handle(request).then(
        ({ status, headers, json }) => {
          response.writeHead(status, {
            ...(json === undefined
              ? {}
              : { "content-type": "application/json" }),
            ...headers,
          });
          response.end(json === undefined ? undefined : JSON.stringify(json));
        },
        (error: unknown) => {
          response.writeHead(500).end(String(error));
        },
      );
    });
    await new Promise<void>((resolve) =>
      this.server!.listen(0, "127.0.0.1", resolve),
    );
    const address = this.server.address();
    if (!address || typeof address === "string") throw new Error("No port");
    this.servedAt = `http://127.0.0.1:${address.port}/realms/test`;
    this.claimedIssuer = options.issuer ?? null;
  }
  async stop() {
    await new Promise<void>((resolve) =>
      this.server ? this.server.close(() => resolve()) : resolve(),
    );
  }
  private async handle(request: IncomingMessage): Promise<{
    status: number;
    headers?: Record<string, string>;
    json?: unknown;
  }> {
    const url = new URL(request.url ?? "/", this.servedAt);
    const path = url.pathname.replace(/^\/realms\/test/, "");
    if (path === "/.well-known/openid-configuration")
      return {
        status: 200,
        json: {
          issuer: this.issuer,
          // The browser-facing endpoint lives on the issuer host; back-channel ones on the served URL.
          authorization_endpoint: `${this.servedAt}/authorize`,
          token_endpoint: `${this.servedAt}/token`,
          jwks_uri: `${this.servedAt}/jwks`,
          response_types_supported: ["code"],
          subject_types_supported: ["public"],
          id_token_signing_alg_values_supported: ["ES256"],
          code_challenge_methods_supported: ["S256"],
          token_endpoint_auth_methods_supported: [
            "client_secret_basic",
            "client_secret_post",
          ],
        },
      };
    if (path === "/jwks")
      return {
        status: 200,
        json: {
          keys: [
            {
              ...(await exportJWK(this.keys!.publicKey)),
              kid: "test",
              alg: "ES256",
              use: "sig",
            },
          ],
        },
      };
    if (path === "/authorize") return this.authorize(url.searchParams);
    if (path === "/token" && request.method === "POST")
      return this.token(request, await body(request));
    return { status: 404, json: { error: "not_found" } };
  }
  private authorize(query: URLSearchParams) {
    this.authorizeCount++;
    this.lastAuthorize = query;
    const redirectUri = query.get("redirect_uri") ?? "";
    if (
      query.get("client_id") !== this.clientId ||
      redirectUri !== this.redirectUri ||
      query.get("response_type") !== "code" ||
      !query.get("scope")?.split(" ").includes("openid") ||
      query.get("code_challenge_method") !== "S256" ||
      !query.get("code_challenge") ||
      !query.get("nonce") ||
      !query.get("state")
    )
      return { status: 400, json: { error: "invalid_request" } };
    const target = new URL(redirectUri);
    target.searchParams.set("state", query.get("state")!);
    if (this.mode === "access_denied")
      target.searchParams.set("error", "access_denied");
    else {
      const code = randomBytes(16).toString("hex");
      this.grants.set(code, {
        challenge: query.get("code_challenge")!,
        nonce:
          this.mode === "wrong_nonce" ? "not-the-nonce" : query.get("nonce")!,
        redirectUri,
        claims: { ...this.claims },
      });
      target.searchParams.set("code", code);
    }
    return { status: 302, headers: { location: target.href } };
  }
  private async token(request: IncomingMessage, form: URLSearchParams) {
    const basic = request.headers.authorization?.startsWith("Basic ")
      ? Buffer.from(request.headers.authorization.slice(6), "base64")
          .toString()
          .split(":")
          .map(decodeURIComponent)
      : null;
    const [clientId, secret] = basic ?? [
      form.get("client_id"),
      form.get("client_secret"),
    ];
    if (clientId !== this.clientId || secret !== this.clientSecret)
      return { status: 401, json: { error: "invalid_client" } };
    const grant = this.grants.get(form.get("code") ?? "");
    this.grants.delete(form.get("code") ?? "");
    const verifier = form.get("code_verifier") ?? "";
    if (
      form.get("grant_type") !== "authorization_code" ||
      !grant ||
      form.get("redirect_uri") !== grant.redirectUri ||
      createHash("sha256").update(verifier).digest("base64url") !==
        grant.challenge
    )
      return { status: 400, json: { error: "invalid_grant" } };
    const { sub, ...claims } = grant.claims;
    const idToken = await new SignJWT({ ...claims, nonce: grant.nonce })
      .setProtectedHeader({ alg: "ES256", kid: "test" })
      .setIssuer(this.issuer)
      .setAudience(this.clientId)
      .setSubject(String(sub))
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(this.keys!.privateKey);
    return {
      status: 200,
      json: {
        access_token: randomBytes(16).toString("hex"),
        token_type: "Bearer",
        expires_in: 300,
        id_token: idToken,
      },
    };
  }
}
