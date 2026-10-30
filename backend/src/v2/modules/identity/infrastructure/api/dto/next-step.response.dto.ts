// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { NextStep } from "../../../application/staff-login";
export class EnrollmentResponseDTO {
  @ApiProperty({ description: "Base32 secret for manual entry" })
  secret!: string;
  @ApiProperty({ description: "otpauth:// address for the QR code" })
  otpauthUri!: string;
}
export class NextStepResponseDTO {
  @ApiProperty({
    description: "Opaque ticket for the next step, valid ten minutes",
  })
  ticket!: string;
  @ApiProperty({ enum: ["password_change", "enroll", "totp"] })
  step!: NextStep["step"];
  @ApiPropertyOptional({ type: EnrollmentResponseDTO })
  enrollment?: EnrollmentResponseDTO;
  static from(value: NextStep): NextStepResponseDTO {
    return {
      ticket: value.ticket,
      step: value.step,
      ...(value.enrollment
        ? {
            enrollment: {
              secret: value.enrollment.secret,
              otpauthUri: value.enrollment.otpauthUri,
            },
          }
        : {}),
    };
  }
}
