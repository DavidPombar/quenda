// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { AnalyticsConfig } from "../../../../../shared/application/analytics-config";
export class WebAnalyticsStatusResponseDTO {
  @ApiProperty({
    description: "Whether the public website sends its page views",
  })
  enabled!: boolean;
}
/** Lets the public website skip analytics calls when the deployment does not count it. */
@V2Controller("public/analytics/web")
export class GetWebAnalyticsStatusController {
  constructor(private readonly config: AnalyticsConfig) {}
  @Get()
  @ApiOperation({ summary: "GetWebAnalyticsStatus" })
  @ApiOkResponse({ type: WebAnalyticsStatusResponseDTO })
  handle(): WebAnalyticsStatusResponseDTO {
    return { enabled: this.config.collects("web") };
  }
}
