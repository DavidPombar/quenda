// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { openDataSchemas, OpenDataSchemaName } from "../../schemas/schemas";

export class SchemaPathRequestDTO {
  @ApiProperty({
    description: "Published schema file",
    enum: Object.keys(openDataSchemas),
  })
  @IsIn(Object.keys(openDataSchemas))
  name!: OpenDataSchemaName;
}
