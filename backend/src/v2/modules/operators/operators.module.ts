// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { InsightsModule } from "../insights/insights.module";
import { DeploymentRepository } from "./domain/deployment.repository";
import { PostgresDeploymentRepository } from "./infrastructure/persistence/postgres-deployment.repository";
import { CreateOperatorSession } from "./application/commands/create-operator-session.command";
import { DeleteOperatorSession } from "./application/commands/delete-operator-session.command";
import { GetOperatorSession } from "./application/queries/get-operator-session.query";
import { CreateMunicipality } from "./application/commands/create-municipality.command";
import { CreateManager } from "./application/commands/create-manager.command";
import { ListDeployment } from "./application/queries/list-deployment.query";
import { GetDeploymentInsights } from "./application/queries/get-deployment-insights.query";
import { CreateOperatorSessionController } from "./infrastructure/api/public/create-operator-session.controller";
import { GetOperatorSessionController } from "./infrastructure/api/public/get-operator-session.controller";
import { DeleteOperatorSessionController } from "./infrastructure/api/public/delete-operator-session.controller";
import { ListDeploymentController } from "./infrastructure/api/operator/list-deployment.controller";
import { CreateMunicipalityController } from "./infrastructure/api/operator/create-municipality.controller";
import { CreateManagerController } from "./infrastructure/api/operator/create-manager.controller";
import { GetDeploymentInsightsController } from "./infrastructure/api/operator/get-deployment-insights.controller";
@Module({
  imports: [InsightsModule],
  providers: [
    CreateOperatorSession,
    DeleteOperatorSession,
    GetOperatorSession,
    CreateMunicipality,
    CreateManager,
    ListDeployment,
    GetDeploymentInsights,
    { provide: DeploymentRepository, useClass: PostgresDeploymentRepository },
  ],
  controllers: [
    CreateOperatorSessionController,
    GetOperatorSessionController,
    DeleteOperatorSessionController,
    ListDeploymentController,
    CreateMunicipalityController,
    CreateManagerController,
    GetDeploymentInsightsController,
  ],
})
export class OperatorsModule {}
