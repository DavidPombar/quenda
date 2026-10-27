// SPDX-License-Identifier: AGPL-3.0-or-later
// Access hardware simulator (M3, #23): a door controller that consumes Quenda's open webhook
// "reserva confirmada → credencial temporal" and decides at the door without asking Quenda.
//
//   ACCESS_WEBHOOK_SECRET=whsec_... [ACCESS_PUBLIC_KEY=<x of the JWK>] npm run simulator:access
//
// Configure http://127.0.0.1:8787/hooks as the webhook in Axustes → Control de acceso, run
// `npm run db:webhooks -- --watch`, then present a QR text with
//   curl -s localhost:8787/present -d '{"token":"..."}'   or by pasting it on stdin.
import {
  createHmac,
  createPublicKey,
  timingSafeEqual,
  verify,
} from "node:crypto";
import { createServer } from "node:http";
import { createInterface } from "node:readline";
const port = Number(process.env.PORT ?? 8787);
const secret = process.env.ACCESS_WEBHOOK_SECRET ?? "";
const publicKey = process.env.ACCESS_PUBLIC_KEY
  ? createPublicKey({
      key: { kty: "OKP", crv: "Ed25519", x: process.env.ACCESS_PUBLIC_KEY },
      format: "jwk",
    })
  : null;
if (!secret.startsWith("whsec_")) {
  console.error("Set ACCESS_WEBHOOK_SECRET to the secret shown in Axustes.");
  process.exit(1);
}
/** Credentials pushed by Quenda, by booking: what a lock keeps in its local allow-list. */
const credentials = new Map();
const seen = new Set();
const log = (message) =>
  console.log(`[${new Date().toLocaleTimeString("gl")}] ${message}`);
/** Standard Webhooks: v1 HMAC-SHA256 of "id.timestamp.body", five-minute tolerance. */
function authentic(headers, body) {
  const id = headers["webhook-id"];
  const timestamp = Number(headers["webhook-timestamp"]);
  if (!id || !timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300)
    return false;
  const expected = createHmac(
    "sha256",
    Buffer.from(secret.slice("whsec_".length), "base64"),
  )
    .update(`${id}.${timestamp}.${body}`)
    .digest();
  return String(headers["webhook-signature"] ?? "")
    .split(" ")
    .some((value) => {
      const [version, signature] = value.split(",");
      const given = Buffer.from(signature ?? "", "base64");
      return (
        version === "v1" &&
        given.length === expected.length &&
        timingSafeEqual(given, expected)
      );
    });
}
function receive(headers, body) {
  if (!authentic(headers, body)) return [401, "invalid signature"];
  // Deliveries are at-least-once: the message id makes them idempotent.
  if (seen.has(headers["webhook-id"])) return [204, ""];
  seen.add(headers["webhook-id"]);
  const event = JSON.parse(body);
  const { data } = event;
  if (event.type === "access.credential.issued") {
    credentials.set(data.bookingId, {
      ...data.credential,
      place: data.facilityName,
    });
    log(
      `Credencial recibida: ${data.facilityName}, ${data.start} → ${data.end}`,
    );
  } else if (event.type === "access.credential.revoked") {
    credentials.delete(data.bookingId);
    log(`Credencial revogada: ${data.facilityName} (${data.status})`);
  }
  return [204, ""];
}
function claimsOf(token) {
  const [header, payload, signature] = token.split(".");
  if (!signature) return null;
  if (
    publicKey &&
    !verify(
      null,
      Buffer.from(`${header}.${payload}`),
      publicKey,
      Buffer.from(signature, "base64url"),
    )
  )
    return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}
/** The door decides offline: known credential, authentic, inside its window. */
function present(token) {
  const claims = claimsOf(token.trim());
  const known = claims && credentials.get(claims.sub);
  const now = Date.now() / 1000;
  const verdict = !claims
    ? "código non válido"
    : !known || known.token !== token.trim()
      ? "credencial descoñecida ou revogada"
      : now < claims.nbf
        ? "aínda non abriu o espazo"
        : now >= claims.exp
          ? "credencial caducada"
          : null;
  if (verdict) log(`Acceso denegado: ${verdict}`);
  else
    log(
      `Porta aberta: ${known.place} (ata ${new Date(claims.exp * 1000).toLocaleTimeString("gl")})`,
    );
  return { open: !verdict, reason: verdict };
}
createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => (body += chunk));
  request.on("end", () => {
    if (request.method === "POST" && request.url === "/hooks") {
      const [status, text] = receive(request.headers, body);
      response.writeHead(status).end(text);
    } else if (request.method === "POST" && request.url === "/present") {
      let token = "";
      try {
        token = String(JSON.parse(body).token ?? "");
      } catch {
        /* Answered as an invalid code. */
      }
      response
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify(present(token)));
    } else if (request.method === "GET" && request.url === "/credentials") {
      response
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify([...credentials.keys()]));
    } else response.writeHead(404).end();
  });
}).listen(port, "127.0.0.1", () =>
  log(`Simulador de acceso en http://127.0.0.1:${port}/hooks`),
);
createInterface({ input: process.stdin }).on("line", (line) => {
  if (line.trim()) present(line);
});
