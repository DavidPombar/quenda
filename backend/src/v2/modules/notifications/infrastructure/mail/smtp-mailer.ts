// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { createTransport, type Transporter } from "nodemailer";
import { Mailer, MailMessage } from "../../application/mailer";
/** One SMTP server per deployment (SMTP_URL); each municipality signs with its own name. */
@Injectable()
export class SmtpMailer extends Mailer {
  private readonly transport: Transporter = createTransport(
    process.env.SMTP_URL ?? "smtp://127.0.0.1:1025",
  );
  private readonly from = process.env.MAIL_FROM ?? "quenda@localhost";
  async send(message: MailMessage) {
    await this.transport.sendMail({
      messageId: `<${message.id}@quenda>`,
      from: { name: message.fromName, address: this.from },
      replyTo: message.replyTo,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: message.headers,
    });
  }
}
