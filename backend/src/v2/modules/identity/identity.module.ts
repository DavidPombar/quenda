// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { CreateSession } from "./application/commands/create-session.command";
import { DeleteSession } from "./application/commands/delete-session.command";
import { GetSession } from "./application/queries/get-session.query";
import { CreateSessionController } from "./infrastructure/api/public/create-session.controller";
import { DeleteSessionController } from "./infrastructure/api/public/delete-session.controller";
import { GetSessionController } from "./infrastructure/api/public/get-session.controller";
@Module({
  providers: [CreateSession, DeleteSession, GetSession],
  controllers: [
    CreateSessionController,
    DeleteSessionController,
    GetSessionController,
  ],
})
export class IdentityModule {}
