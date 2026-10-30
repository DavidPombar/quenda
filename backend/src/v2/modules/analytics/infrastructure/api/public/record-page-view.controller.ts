// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Headers, HttpCode, Ip, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Request } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { RecordPageView } from "../../../application/commands/record-page-view.command";
import { PageViewRequestDTO } from "../dto/page-view.request.dto";
@V2Controller("public/analytics/pageview")
export class RecordPageViewController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RecordPageView);
  }
  @Post()
  @HttpCode(204)
  @ApiOperation({
    summary: "RecordPageView",
    description:
      "Passes a page view to the municipality's own Umami when it has web analytics on; always 204",
  })
  @ApiResponse({ status: 204, description: "Accepted" })
  async handle(
    @Body() body: PageViewRequestDTO,
    @Headers("user-agent") userAgent: string | undefined,
    @Ip() ip: string,
    @Req() request: Request,
  ): Promise<void> {
    await this.operation.execute({
      slug: body.slug,
      path: body.path,
      language: body.language,
      screen: body.screen,
      hostname: request.hostname,
      userAgent: userAgent ?? "",
      ip,
    });
  }
}
