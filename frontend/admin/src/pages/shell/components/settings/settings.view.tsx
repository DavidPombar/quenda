// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { useSettingsController } from "./settings.controller";
import { BookingRules } from "./components/booking-rules/booking-rules.view";
import { General } from "./components/general/general.view";
import { LegalTexts } from "./components/legal-texts/legal-texts.view";
import { Branding } from "./components/branding/branding.view";
import { Holidays } from "./components/holidays/holidays.view";
import { UserCategories } from "./components/user-categories/user-categories.view";
import { NoShowPenalty } from "./components/no-show-penalty/no-show-penalty.view";
import { AccessQr } from "./components/access-qr/access-qr.view";
import { Sports } from "./components/sports/sports.view";
export function Settings() {
  const c = useSettingsController();
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{c.t("settings")}</h1>
          <p className="page-subtitle">{c.t("settingsSubtitle")}</p>
        </div>
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("managerOnly")}</h2>
          <p>{c.t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : c.settings.isError ? (
        <Feedback
          message={c.t("loadError")}
          error
          retryLabel={c.t("retry")}
          retry={() => {
            void c.settings.refetch();
          }}
        />
      ) : c.settings.isPending ? (
        <Feedback message={c.t("loading")} />
      ) : (
        // Each section saves on its own, so new sections slot in without a shared form.
        <div className="settings-sections">
          <BookingRules settings={c.settings.data} t={c.t} />
          <NoShowPenalty settings={c.settings.data} t={c.t} />
          <General settings={c.settings.data} t={c.t} />
          <LegalTexts settings={c.settings.data} t={c.t} locale={c.locale} />
          <Branding settings={c.settings.data} t={c.t} />
          <Holidays settings={c.settings.data} t={c.t} locale={c.locale} />
          <AccessQr
            tenantId={c.municipality.id}
            timezone={c.municipality.timezone}
            locale={c.locale}
            t={c.t}
          />
          <UserCategories settings={c.settings.data} t={c.t} />
          <Sports userId={c.session?.userId} t={c.t} />
        </div>
      )}
    </div>
  );
}
