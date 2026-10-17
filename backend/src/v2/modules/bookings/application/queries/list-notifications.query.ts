// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { NotificationRepository } from "../../domain/notification.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListNotifications {
  constructor(private readonly notifications: NotificationRepository) {}
  async execute(args: { principal: Principal }) {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.notifications.list(
        args.principal.tenantId,
        args.principal.userId,
      ),
    );
  }
}
