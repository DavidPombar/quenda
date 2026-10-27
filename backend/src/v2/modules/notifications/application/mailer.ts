// SPDX-License-Identifier: AGPL-3.0-or-later
export interface MailMessage {
  /** Outbox id; becomes the Message-ID so a repeated delivery can be recognised. */
  id: string;
  to: string;
  fromName: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
}
export abstract class Mailer {
  /** Throws when the message could not be handed to the mail server. */
  abstract send(message: MailMessage): Promise<void>;
}
