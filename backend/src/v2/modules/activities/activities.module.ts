// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { FacilitiesModule } from "../facilities/facilities.module";
import { ActivityRepository } from "./domain/activity.repository";
import { PostgresActivityRepository } from "./infrastructure/persistence/postgres-activity.repository";
import { ActivityPlanner } from "./application/activity-planner";
import { ActivityPreparation } from "./application/activity-preparation";
import { CreateActivity } from "./application/commands/create-activity.command";
import { UpdateActivity } from "./application/commands/update-activity.command";
import { PublishActivity } from "./application/commands/publish-activity.command";
import { CancelActivity } from "./application/commands/cancel-activity.command";
import { CancelActivitySession } from "./application/commands/cancel-activity-session.command";
import { ListManagedActivities } from "./application/queries/list-managed-activities.query";
import { GetManagedActivity } from "./application/queries/get-managed-activity.query";
import { ListPublicActivities } from "./application/queries/list-public-activities.query";
import { GetPublicActivity } from "./application/queries/get-public-activity.query";
import { ListManagedActivitiesController } from "./infrastructure/api/manager/list-managed-activities.controller";
import { GetManagedActivityController } from "./infrastructure/api/manager/get-managed-activity.controller";
import { CreateActivityController } from "./infrastructure/api/manager/create-activity.controller";
import { UpdateActivityController } from "./infrastructure/api/manager/update-activity.controller";
import { PublishActivityController } from "./infrastructure/api/manager/publish-activity.controller";
import { CancelActivityController } from "./infrastructure/api/manager/cancel-activity.controller";
import { CancelActivitySessionController } from "./infrastructure/api/manager/cancel-activity-session.controller";
import { ListPublicActivitiesController } from "./infrastructure/api/public/list-public-activities.controller";
import { GetPublicActivityController } from "./infrastructure/api/public/get-public-activity.controller";
/** Activities and sports schools with places and weekly sessions (#97). */
@Module({
  imports: [FacilitiesModule],
  providers: [
    ActivityPlanner,
    ActivityPreparation,
    CreateActivity,
    UpdateActivity,
    PublishActivity,
    CancelActivity,
    CancelActivitySession,
    ListManagedActivities,
    GetManagedActivity,
    ListPublicActivities,
    GetPublicActivity,
    { provide: ActivityRepository, useClass: PostgresActivityRepository },
  ],
  controllers: [
    ListManagedActivitiesController,
    GetManagedActivityController,
    CreateActivityController,
    UpdateActivityController,
    PublishActivityController,
    CancelActivityController,
    CancelActivitySessionController,
    ListPublicActivitiesController,
    GetPublicActivityController,
  ],
})
export class ActivitiesModule {}
