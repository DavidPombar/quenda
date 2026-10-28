# Public identity (T3, T4)

The competition rules require "autenticación pública" (T3) and secure user management (T4). Quenda
does not ship its own identity provider for citizens. The backend is a **generic OpenID Connect
client**: any OIDC provider can sign citizens in, and a council or *deputación* chooses which one.
The repository includes Keycloak as a reference provider that brokers a **simulated** Cl@ve, so the
whole path can be demonstrated without access to the real Cl@ve test environment.

## Sign-in methods

| Method | Who | Assurance | Status |
|---|---|---|---|
| OIDC (Cl@ve through a broker, Chave365, any provider) | Citizens | `eid` | This slice |
| Email and one-time code | Citizens, occasional bookings | `email` | Next slice (issue #8, part B) |
| Local account with password and TOTP | Municipal managers | `local` | Last slice (issue #8, part C) |
| One-click synthetic accounts | Jury and developers | `demo` | Only with `DEMO_MODE=true` |

`GET /v2/public/auth/methods` returns `{ demo, oidc: { label } | null, email }`, and the citizen
sign-in dialog shows only the enabled methods. Every account records its `assurance` and the
`Principal` carries it, so later features (for example the season allocation to clubs in #17) can
require an electronic identity instead of an email address.

## OIDC flow

The privacy notice must be accepted before any method starts: the dialog sends the municipality's
current `legalVersion`, and the backend rejects older versions with `consent_required` before
redirecting anywhere.

1. The browser navigates to `GET /v2/public/auth/oidc/start?slug&legalVersion&returnTo`. The
   backend stores a login attempt (hashed `state`, `nonce`, PKCE verifier, notice version and
   return path, valid for ten minutes), sets the `quenda_login` cookie and redirects to the
   provider. `returnTo` must be a path under `/app/`; anything else falls back to the catalog.
2. The provider authenticates the person and redirects to
   `GET /v2/public/auth/oidc/callback?code&state` (query response mode, so the callback is a GET
   and needs no same-origin header).
3. The backend checks `state` against the cookie, consumes the attempt, exchanges the code with
   PKCE outside any database transaction, and validates issuer, audience and nonce.
4. In one transaction it finds or creates the account by `(municipality, issuer, subject)`,
   records the notice acceptance (`consents`) and the `consent.accepted` and `auth.signed_in`
   audit events, and opens the usual eight-hour session.
5. It sets `quenda_session` and redirects to the return path. Any failure redirects to the
   catalog with `?authError=` (`consent_required`, `login_expired`, `login_rejected`,
   `oidc_unavailable`); the app shows a localised alert.

The same person gets a separate account in each municipality, so tenant isolation (R3) holds even
when one provider serves a whole province.

### Cookies

| Cookie | Purpose | Attributes |
|---|---|---|
| `quenda_login` | Binds the browser that started the login to the callback | HttpOnly, `SameSite=Lax` (it must travel on the redirect back from the provider), `Path=/v2/public/auth`, ten minutes, Secure in production |
| `quenda_session` | The session | HttpOnly, `SameSite=Strict`, eight hours, Secure in production |

### Personal data from the provider

Quenda keeps the provider's subject identifier, a display name built from the given name and
surname, and the email address if the provider sends one. The tax identifier (`nif` claim) is
stored only when the municipality enables `store_nif` (needed to verify residence for fees, #13)
and a data key is configured: it is encrypted with AES-256-GCM and accompanied by an HMAC digest
for lookups, never stored in plain text. The account export includes these fields and account
deletion removes them. See [data protection](data-protection.md).

## Configuration

| Variable | Meaning |
|---|---|
| `PUBLIC_URL` | Public origin of the deployment, used to build the callback URL (for example `http://127.0.0.1:5173` in development or `https://reservas.example.gal`) |
| `OIDC_ISSUER` | Issuer URL of the provider, as it appears in tokens |
| `OIDC_DISCOVERY_URL` | Optional. Where the API fetches the provider metadata when it cannot reach the public issuer URL (for example `http://keycloak:8080/realms/quenda` inside Compose). Tokens must still carry `OIDC_ISSUER` |
| `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` | Confidential client registered at the provider |
| `OIDC_LABEL` | Button label, for example `Cl@ve` |
| `OIDC_IDP_HINT` | Optional `kc_idp_hint`, so Keycloak skips its own chooser and goes straight to the brokered provider |
| `QUENDA_DATA_KEY` | Base64 of 32 random bytes; required to store the NIF (and, later, TOTP secrets). Without it those fields are not stored |

OIDC is enabled only when `PUBLIC_URL`, `OIDC_ISSUER` and `OIDC_CLIENT_ID` are set. Plain-HTTP
issuers are accepted only for loopback and Compose service names, for local development.

## Reference provider: Keycloak with a simulated Cl@ve

`npm run identity:up` starts Keycloak 26.8.0 (Apache-2.0) from the `identity` Compose profile at
`http://127.0.0.1:8081` and imports two realms from `deploy/keycloak/` (it runs `start-dev` with an
in-container database, so every start re-imports them; `npm run identity:down` removes it):

- `quenda`: the realm Quenda trusts. Its client `quenda` is confidential with PKCE, and its
  identity provider `clave` is a SAML 2.0 broker. Claims for given name, surname, email and NIF are
  mapped into the ID token.
- `clave-sim`: a SAML identity provider that stands in for Cl@ve. Its login page reads «Cl@ve
  SIMULADO · entorno local de pruebas, no es Cl@ve». It signs its assertions with a key published
  in the repository on purpose, and has two fictitious people whose user name is a test NIF:

  | User | Name | Password |
  |---|---|---|
  | `99999999R` | Uxía Fernández Rial | `clave-local` |
  | `11111111H` | Brais Lorenzo Otero | `clave-local` |

The client secret (`quenda-local-dev-secret-NO-PRODUCCION`), the admin password and the signing key
are for loopback development only.

For the container demonstration run
`docker compose --profile identity -f compose.yml -f compose.demo.yml up --build --wait`: the API
discovers Keycloak through `OIDC_DISCOVERY_URL=http://keycloak:8080/realms/quenda` while browsers and
tokens use `http://127.0.0.1:8081`. Without the profile the **Entrar con Cl@ve** button still shows
and fails with `oidc_unavailable`; the demo accounts keep working.

The development values for the backend are in `.env.example`. Keycloak is optional and needs about
1 GB of memory: a small council can use any OIDC provider, typically one operated by its
*deputación*.

## What the simulation does not prove

- **Real Cl@ve** is a SAML 2.0 federation with eIDAS/STORK extensions (levels of assurance,
  `PersonIdentifier` in `ES/ES/…` format, URI attribute names, signed authentication requests,
  encrypted assertions and federation metadata). Joining it requires registration in Registro-Cl@ve, which a public administration
  must request; the natural route for a small council is its *deputación*, which already publishes
  Cl@ve onboarding guides for local entities. The simulation validates the shape of the
  integration (SAML broker → OIDC → Quenda), not Cl@ve's specific profile.
- **Chave365** (Xunta de Galicia) has no public integration documentation for third parties; it can
  be added as another brokered provider if AMTEGA enables it.
- **European Digital Identity Wallet:** because Quenda only speaks OIDC, a verifier using
  OpenID4VP can be added at the provider level later without changes to the application.

## Not covered yet

Email codes and local manager accounts arrive in the next slices of issue #8. Single logout at the
provider, account linking across methods and step-up authentication are not implemented.
