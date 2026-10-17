// SPDX-License-Identifier: AGPL-3.0-or-later
import { createApp } from "./bootstrap";
async function main() {
  const app = await createApp();
  await app.listen(
    Number(process.env.PORT ?? 3001),
    process.env.HOST ?? "127.0.0.1",
  );
}
void main();
