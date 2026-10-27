// SPDX-License-Identifier: AGPL-3.0-or-later
// Stands in for a door controller: receives Quenda's access webhooks, checks the signature and
// prints the credential it would grant or revoke. Usage:
//   ACCESS_WEBHOOK_SECRET=<secret shown in Axustes> npm run access:simulator
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
const port = Number(process.env.PORT ?? 4100);
const secret = process.env.ACCESS_WEBHOOK_SECRET ?? "";
const seen = new Set();
if (!secret)
  console.warn(
    "ACCESS_WEBHOOK_SECRET is empty: signatures will be reported as invalid.",
  );
function valid(signature, body) {
  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`,
  );
  const given = Buffer.from(signature ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
createServer((request, response) => {
  if (request.method !== "POST") {
    response.writeHead(405).end();
    return;
  }
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    const body = Buffer.concat(chunks).toString("utf8");
    const delivery = request.headers["x-quenda-delivery"];
    if (!valid(request.headers["x-quenda-signature"], body)) {
      console.log(`✗ rejected ${delivery}: invalid signature`);
      response.writeHead(401).end();
      return;
    }
    // Deliveries are at-least-once; a repeated id is acknowledged without acting again.
    if (seen.has(delivery)) {
      response.writeHead(200).end();
      return;
    }
    seen.add(delivery);
    const event = JSON.parse(body);
    const action =
      event.event === "credential.granted" ? "🔓 grant" : "🔒 revoke";
    console.log(
      `${action} ${event.bookingId} at facility ${event.facilityId} ` +
        `${event.validFrom} → ${event.validUntil} (${event.reason}; lights follow the same window)`,
    );
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end('{"ok":true}');
  });
}).listen(port, "127.0.0.1", () =>
  console.log(`Access simulator listening on http://127.0.0.1:${port}/`),
);
