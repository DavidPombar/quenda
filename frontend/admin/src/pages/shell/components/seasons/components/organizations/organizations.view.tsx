// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import { fill, type TextKey } from "@/services/i18n.service";
import type { Organization } from "@/types/models";
import { useOrganizationsController } from "./organizations.controller";
const SPORTS = ["padel", "tennis", "futsal", "swimming"] as const;
export function Organizations(p: {
  organizations: Organization[];
  t: (key: TextKey) => string;
}) {
  const c = useOrganizationsController();
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="clubs-title">
      <h2 id="clubs-title">{t("clubs")}</h2>
      {c.message && (
        <p
          role={c.message.error ? "alert" : "status"}
          className={c.message.error ? "error-text" : "success-message"}
        >
          {t(c.message.key)}
        </p>
      )}
      {p.organizations.length === 0 ? (
        <p className="muted">{t("clubsEmpty")}</p>
      ) : (
        <ul className="season-list">
          {p.organizations.map((organization) => (
            <li key={organization.id} className="season-card">
              <div className="season-card-heading">
                <h3>{organization.name}</h3>
                <span className="muted">
                  {[
                    organization.taxId,
                    organization.sport && t(organization.sport),
                    organization.contactEmail,
                    organization.archivedAt && t("clubArchived"),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void c.toggleArchive(organization);
                  }}
                >
                  {t(organization.archivedAt ? "clubRestore" : "clubArchive")}
                </Button>
              </div>
              <h4>{t("representatives")}</h4>
              {organization.representatives.length === 0 ? (
                <p className="muted">{t("representativesNone")}</p>
              ) : (
                <ul className="tag-list">
                  {organization.representatives.map((person) => (
                    <li key={person.userId}>
                      {person.displayName}
                      {person.email && (
                        <span className="muted"> · {person.email}</span>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        aria-label={fill(t("representativeRemove"), {
                          name: person.displayName,
                        })}
                        onClick={() => {
                          void c.removeRepresentative(
                            organization.id,
                            person.userId,
                          );
                        }}
                      >
                        <PiX aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="inline-form"
                aria-label={`${t("representativeAdd")}: ${organization.name}`}
                onSubmit={(event) => {
                  void c.addRepresentative(event, organization);
                }}
              >
                <Field.Root className="field">
                  <Field.Label>{t("representativeEmail")}</Field.Label>
                  <Input
                    type="email"
                    value={c.email(organization.id)}
                    onChange={(event) =>
                      c.setEmail(organization.id, event.target.value)
                    }
                  />
                </Field.Root>
                <Button type="submit" variant="outline">
                  {t("representativeAdd")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form
        className="form-grid settings-grid"
        aria-label={t("clubCreate")}
        onSubmit={(event) => {
          void c.submit(event);
        }}
      >
        <Field.Root className="field" required>
          <Field.Label>
            {t("clubName")}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={c.draft.name}
            onChange={(event) => c.edit({ name: event.target.value })}
          />
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("clubTaxId")}</Field.Label>
          <Input
            value={c.draft.taxId ?? ""}
            onChange={(event) => c.edit({ taxId: event.target.value })}
          />
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("clubSport")}</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={c.draft.sport ?? ""}
              onChange={(event) => c.setSport(event.target.value)}
            >
              <option value="">{t("clubSportNone")}</option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>
                  {t(sport)}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("clubContact")}</Field.Label>
          <Input
            type="email"
            value={c.draft.contactEmail ?? ""}
            onChange={(event) => c.edit({ contactEmail: event.target.value })}
          />
        </Field.Root>
        <div className="full">
          <Button
            type="submit"
            colorPalette="court"
            loading={c.create.isPending}
          >
            {t("clubCreate")}
          </Button>
        </div>
      </form>
    </section>
  );
}
