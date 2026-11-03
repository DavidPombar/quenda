// SPDX-License-Identifier: AGPL-3.0-or-later
import { Global, Module } from "@nestjs/common";
import { ActivityEnrolments } from "../../shared/application/activity-enrolments";
import { OpeningCalendar } from "../facilities/domain/opening-calendar";
import { HolidayCalendar } from "../facilities/domain/holiday-calendar";
import { IcalOpeningCalendar } from "../facilities/infrastructure/calendar/ical-opening-calendar";
import { IcalHolidayCalendar } from "../facilities/infrastructure/calendar/ical-holiday-calendar";
import { NotificationRepository } from "../bookings/domain/notification.repository";
import { PostgresNotificationRepository } from "../bookings/infrastructure/persistence/postgres-notification.repository";
import { ActivityRepository } from "./domain/activity.repository";
import { PostgresActivityRepository } from "./infrastructure/persistence/postgres-activity.repository";
import { EnrolmentRepository } from "./domain/enrolment.repository";
import { PostgresEnrolmentRepository } from "./infrastructure/persistence/postgres-enrolment.repository";
import { EnrolmentNotices } from "./application/enrolment-notices";
import { DependantRepository } from "./domain/dependant.repository";
import { PostgresDependantRepository } from "./infrastructure/persistence/postgres-dependant.repository";
import { AddDependant } from "./application/commands/add-dependant.command";
import { UpdateDependant } from "./application/commands/update-dependant.command";
import { RemoveDependant } from "./application/commands/remove-dependant.command";
import { ListDependants } from "./application/queries/list-dependants.query";
import { ListDependantsController } from "./infrastructure/api/citizen/list-dependants.controller";
import { AddDependantController } from "./infrastructure/api/citizen/add-dependant.controller";
import { UpdateDependantController } from "./infrastructure/api/citizen/update-dependant.controller";
import { RemoveDependantController } from "./infrastructure/api/citizen/remove-dependant.controller";
import { EnrolmentQueue } from "./application/enrolment-queue";
import { EnrolInActivity } from "./application/commands/enrol-in-activity.command";
import { LeaveActivity } from "./application/commands/leave-activity.command";
import { RemoveEnrolment } from "./application/commands/remove-enrolment.command";
import { ExportActivityEnrolments } from "./application/commands/export-activity-enrolments.command";
import { ListMyEnrolments } from "./application/queries/list-my-enrolments.query";
import { ListActivityEnrolments } from "./application/queries/list-activity-enrolments.query";
import { EnrolInActivityController } from "./infrastructure/api/citizen/enrol-in-activity.controller";
import { LeaveActivityController } from "./infrastructure/api/citizen/leave-activity.controller";
import { ListMyEnrolmentsController } from "./infrastructure/api/citizen/list-my-enrolments.controller";
import { ListActivityEnrolmentsController } from "./infrastructure/api/manager/list-activity-enrolments.controller";
import { ExportActivityEnrolmentsController } from "./infrastructure/api/manager/export-activity-enrolments.controller";
import { RemoveEnrolmentController } from "./infrastructure/api/manager/remove-enrolment.controller";
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
/**
 * Activities and sports schools with places, weekly sessions and enrolment (#97). Global because
 * facilities and accounts cancel sessions or remove people through `ActivityEnrolments` in their
 * own transaction; it binds its own adapters of the ports it shares so it imports no module that
 * depends on it.
 */
@Global()
@Module({
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
    EnrolmentNotices,
    EnrolmentQueue,
    { provide: ActivityEnrolments, useExisting: EnrolmentQueue },
    EnrolInActivity,
    LeaveActivity,
    RemoveEnrolment,
    ExportActivityEnrolments,
    ListMyEnrolments,
    ListActivityEnrolments,
    AddDependant,
    UpdateDependant,
    RemoveDependant,
    ListDependants,
    { provide: DependantRepository, useClass: PostgresDependantRepository },
    { provide: ActivityRepository, useClass: PostgresActivityRepository },
    { provide: EnrolmentRepository, useClass: PostgresEnrolmentRepository },
    {
      provide: NotificationRepository,
      useClass: PostgresNotificationRepository,
    },
    { provide: OpeningCalendar, useClass: IcalOpeningCalendar },
    { provide: HolidayCalendar, useClass: IcalHolidayCalendar },
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
    EnrolInActivityController,
    LeaveActivityController,
    ListMyEnrolmentsController,
    ListActivityEnrolmentsController,
    ExportActivityEnrolmentsController,
    RemoveEnrolmentController,
    ListDependantsController,
    AddDependantController,
    UpdateDependantController,
    RemoveDependantController,
  ],
  exports: [ActivityEnrolments],
})
export class ActivitiesModule {}
