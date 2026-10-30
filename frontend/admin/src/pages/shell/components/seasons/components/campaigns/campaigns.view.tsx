// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect, Textarea } from "@chakra-ui/react";
import { dayLabel } from "@/services/date.service";
import { fill, type TextKey } from "@/services/i18n.service";
import type { Campaign, Facility, Locale } from "@/types/models";
import { useCampaignsController } from "./campaigns.controller";
export function Campaigns(p: {
  campaigns: Campaign[];
  facilities: Facility[];
  selected: string;
  onSelect: (id: string) => void;
  t: (key: TextKey) => string;
  locale: Locale;
}) {
  const c = useCampaignsController(p.onSelect);
  const { t } = p;
  const names = new Map(p.facilities.map((item) => [item.id, item.name]));
  const current = p.campaigns.find((item) => item.id === p.selected);
  return (
    <section className="settings-section" aria-labelledby="campaigns-title">
      <h2 id="campaigns-title">{t("campaigns")}</h2>
      {p.campaigns.length === 0 ? (
        <p className="muted">{t("campaignsEmpty")}</p>
      ) : (
        <>
          <Field.Root className="field">
            <Field.Label>{t("campaignChoose")}</Field.Label>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={p.selected}
                onChange={(event) => p.onSelect(event.target.value)}
              >
                {p.campaigns.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Field.Root>
          {current && (
            <div className="season-card">
              <p>
                {fill(t("campaignPeriod"), {
                  from: dayLabel(current.startsOn, p.locale),
                  to: dayLabel(current.endsOn, p.locale),
                })}
                {" · "}
                {current.facilityIds
                  .map((id) => names.get(id) ?? id)
                  .join(", ")}
              </p>
              {current.criteria[p.locale] && (
                <p className="muted">{current.criteria[p.locale]}</p>
              )}
            </div>
          )}
        </>
      )}
      <form
        className="form-grid settings-grid"
        aria-label={t("campaignCreate")}
        onSubmit={(event) => {
          void c.submit(event);
        }}
      >
        <Field.Root className="field full" required>
          <Field.Label>
            {t("campaignName")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={c.draft.name}
            onChange={(event) => c.edit({ name: event.target.value })}
          />
        </Field.Root>
        <Field.Root className="field" required>
          <Field.Label>
            {t("campaignStart")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="date"
            value={c.draft.startsOn}
            onChange={(event) => c.edit({ startsOn: event.target.value })}
          />
        </Field.Root>
        <Field.Root className="field" required>
          <Field.Label>
            {t("campaignEnd")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="date"
            value={c.draft.endsOn}
            onChange={(event) => c.edit({ endsOn: event.target.value })}
          />
        </Field.Root>
        <fieldset className="full checkbox-group">
          <legend>{t("campaignFacilities")}</legend>
          {p.facilities.map((facility) => (
            <label key={facility.id} className="checkbox-field">
              <input
                type="checkbox"
                checked={c.draft.facilityIds.includes(facility.id)}
                onChange={() => c.toggleFacility(facility.id)}
              />
              {facility.name}
            </label>
          ))}
        </fieldset>
        <Field.Root className="field full">
          <Field.Label>{t("criteriaGl")}</Field.Label>
          <Textarea
            value={c.draft.criteria.gl}
            onChange={(event) => c.editCriteria("gl", event.target.value)}
          />
        </Field.Root>
        <Field.Root className="field full">
          <Field.Label>{t("criteriaEs")}</Field.Label>
          <Textarea
            value={c.draft.criteria.es}
            onChange={(event) => c.editCriteria("es", event.target.value)}
          />
        </Field.Root>
        <div className="full">
          <Button type="submit" colorPalette="court" loading={c.save.isPending}>
            {t("campaignCreate")}
          </Button>
        </div>
        {c.created && (
          <p role="status" className="success-message full">
            {t("campaignCreated")}
          </p>
        )}
        {c.save.isError && (
          <p role="alert" className="error-text full">
            {t("seasonError")}
          </p>
        )}
      </form>
    </section>
  );
}
