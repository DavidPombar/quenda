// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  Credential,
  CredentialRepository,
} from "../domain/credential.repository";
import { Audit, AuditDetails } from "../../../shared/application/audit";
import { OperatorAudit } from "../../../shared/application/operator-audit";
/** Sign-in events of a local account, in its municipality's trail or the deployment's. */
@Injectable()
export class StaffAudit {
  constructor(
    private readonly credentials: CredentialRepository,
    private readonly audit: Audit,
    private readonly operatorAudit: OperatorAudit,
  ) {}
  async record(
    credential: Credential,
    action: string,
    details: AuditDetails = {},
  ) {
    if (credential.realm === "tenant" && credential.tenantId)
      return this.audit.recordSystem(
        credential.tenantId,
        action,
        credential.subjectId,
        {
          login: credential.login,
          ...details,
        },
      );
    const operator = await this.credentials.operatorPrincipal(
      credential.subjectId,
    );
    if (operator)
      await this.operatorAudit.record(
        operator,
        action,
        credential.subjectId,
        null,
        {
          login: credential.login,
          ...details,
        },
      );
  }
}
