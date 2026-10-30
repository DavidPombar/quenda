// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import {
  NoticeKind,
  noticeKinds,
} from "../../../../../shared/application/notice-preferences";
export class UnsubscribeResponseDTO {
  @ApiProperty({
    description: "Notice no longer sent by email",
    enum: noticeKinds,
  })
  kind!: NoticeKind;
}
