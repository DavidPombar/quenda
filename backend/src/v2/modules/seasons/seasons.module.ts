// SPDX-License-Identifier: AGPL-3.0-or-later
import { Module } from "@nestjs/common";
import { SeasonRepository } from "./domain/season.repository";
import { PostgresSeasonRepository } from "./infrastructure/persistence/postgres-season.repository";
import { CreateOrganization } from "./application/commands/create-organization.command";
import { UpdateOrganization } from "./application/commands/update-organization.command";
import { AddRepresentative } from "./application/commands/add-representative.command";
import { RemoveRepresentative } from "./application/commands/remove-representative.command";
import { SaveCampaign } from "./application/commands/save-campaign.command";
import { AssignSeasonSlot } from "./application/commands/assign-season-slot.command";
import { CancelSeasonAllocation } from "./application/commands/cancel-season-allocation.command";
import { CancelSeasonOccurrence } from "./application/commands/cancel-season-occurrence.command";
import { ListOrganizations } from "./application/queries/list-organizations.query";
import { ListCampaigns } from "./application/queries/list-campaigns.query";
import { ListSeasonAllocations } from "./application/queries/list-season-allocations.query";
import { ListPublicCampaigns } from "./application/queries/list-public-campaigns.query";
import { GetMyClub } from "./application/queries/get-my-club.query";
import { AddRepresentativeController } from "./infrastructure/api/manager/add-representative.controller";
import { AssignSeasonSlotController } from "./infrastructure/api/manager/assign-season-slot.controller";
import { CancelSeasonAllocationController } from "./infrastructure/api/manager/cancel-season-allocation.controller";
import { CancelSeasonOccurrenceController } from "./infrastructure/api/manager/cancel-season-occurrence.controller";
import { CreateCampaignController } from "./infrastructure/api/manager/create-campaign.controller";
import { CreateOrganizationController } from "./infrastructure/api/manager/create-organization.controller";
import { ListCampaignsController } from "./infrastructure/api/manager/list-campaigns.controller";
import { ListOrganizationsController } from "./infrastructure/api/manager/list-organizations.controller";
import { ListSeasonAllocationsController } from "./infrastructure/api/manager/list-season-allocations.controller";
import { RemoveRepresentativeController } from "./infrastructure/api/manager/remove-representative.controller";
import { UpdateCampaignController } from "./infrastructure/api/manager/update-campaign.controller";
import { UpdateOrganizationController } from "./infrastructure/api/manager/update-organization.controller";
import { ListPublicCampaignsController } from "./infrastructure/api/public/list-public-campaigns.controller";
import { GetMyClubController } from "./infrastructure/api/citizen/get-my-club.controller";
/** Season allocation of recurring slots to clubs (#17). */
@Module({
  providers: [
    CreateOrganization,
    UpdateOrganization,
    AddRepresentative,
    RemoveRepresentative,
    SaveCampaign,
    AssignSeasonSlot,
    CancelSeasonAllocation,
    CancelSeasonOccurrence,
    ListOrganizations,
    ListCampaigns,
    ListSeasonAllocations,
    ListPublicCampaigns,
    GetMyClub,
    { provide: SeasonRepository, useClass: PostgresSeasonRepository },
  ],
  controllers: [
    AddRepresentativeController,
    AssignSeasonSlotController,
    CancelSeasonAllocationController,
    CancelSeasonOccurrenceController,
    CreateCampaignController,
    CreateOrganizationController,
    ListCampaignsController,
    ListOrganizationsController,
    ListSeasonAllocationsController,
    RemoveRepresentativeController,
    UpdateCampaignController,
    UpdateOrganizationController,
    ListPublicCampaignsController,
    GetMyClubController,
  ],
})
export class SeasonsModule {}
