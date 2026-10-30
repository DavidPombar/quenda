// SPDX-License-Identifier: AGPL-3.0-or-later
import { createServer, type Server, type Socket } from "node:net";
export interface ReceivedMail {
  to: string;
  data: string;
}
/**
 * Minimal SMTP server for tests: accepts every message and keeps it, or refuses all of them while
 * `failing` is set (to exercise retries). Enough for nodemailer without TLS or authentication.
 */
export class FakeSmtp {
  readonly mails: ReceivedMail[] = [];
  failing = false;
  private server?: Server;
  url = "";
  async start() {
    this.server = createServer((socket) => this.session(socket));
    await new Promise<void>((resolve) =>
      this.server!.listen(0, "127.0.0.1", resolve),
    );
    const address = this.server.address();
    this.url = `smtp://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
  }
  stop() {
    return new Promise<void>(
      (resolve) => this.server?.close(() => resolve()) ?? resolve(),
    );
  }
  private session(socket: Socket) {
    let buffer = "";
    let inData = false;
    let to = "";
    let data = "";
    socket.write("220 fake ESMTP\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let index: number;
      while ((index = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (inData) {
          if (line === ".") {
            inData = false;
            if (this.failing) socket.write("451 try later\r\n");
            else {
              this.mails.push({ to, data });
              socket.write("250 queued\r\n");
            }
            data = "";
          } else data += `${line.startsWith("..") ? line.slice(1) : line}\n`;
          continue;
        }
        const command = line.slice(0, 4).toUpperCase();
        if (command === "EHLO" || command === "HELO")
          socket.write("250 fake\r\n");
        else if (command === "MAIL") socket.write("250 ok\r\n");
        else if (command === "RCPT") {
          to = /<([^>]*)>/.exec(line)?.[1] ?? "";
          socket.write("250 ok\r\n");
        } else if (command === "DATA") {
          inData = true;
          socket.write("354 go ahead\r\n");
        } else if (command === "QUIT") {
          socket.write("221 bye\r\n");
          socket.end();
        } else socket.write("250 ok\r\n");
      }
    });
    socket.on("error", () => undefined);
  }
}
