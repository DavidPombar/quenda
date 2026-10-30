// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable, Logger } from "@nestjs/common";
import { Commands } from "../../../../shared/infrastructure/commands.locator";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Mailer } from "../../../../shared/application/mailer";
import { ClaimLoginCodes } from "../../application/commands/claim-login-codes.command";
import { CompleteLoginCode } from "../../application/commands/complete-login-code.command";
import { renderLoginCode } from "./login-code-mail";
const BATCH_SIZE = 20;
/**
 * Mails one-time codes outside any transaction: right after a code is requested, and again from
 * the delivery worker for any left unsent by a mail server failure.
 */
@Injectable()
export class LoginCodeSender {
  private readonly logger = new Logger(LoginCodeSender.name);
  constructor(
    private readonly commands: Commands,
    private readonly municipalities: Municipalities,
    private readonly mailer: Mailer,
  ) {}
  /** Sends the given code, or every pending one; returns how many were sent. */
  async send(id?: string) {
    const codes = (
      await this.commands
        .get(ClaimLoginCodes)
        .execute({ id, limit: id ? 1 : BATCH_SIZE })
    ).fold(
      (value) => value,
      () => [],
    );
    let sent = 0;
    for (const code of codes) {
      let error: string | undefined;
      try {
        const municipality = await this.municipalities.find(code.tenantId);
        if (!municipality) throw new Error("Municipality not found");
        await this.mailer.send({
          id: code.id,
          to: code.recipient,
          fromName: municipality.mailSenderName || municipality.name,
          replyTo: municipality.mailReplyTo || municipality.contact,
          ...renderLoginCode({
            code: code.code,
            locale: code.locale,
            municipality: municipality.name,
          }),
          headers: {},
        });
        sent += 1;
      } catch (failure) {
        error = failure instanceof Error ? failure.message : String(failure);
        this.logger.warn(`login code not sent: ${error}`);
      }
      await this.commands
        .get(CompleteLoginCode)
        .execute({ id: code.id, error });
    }
    return sent;
  }
}
