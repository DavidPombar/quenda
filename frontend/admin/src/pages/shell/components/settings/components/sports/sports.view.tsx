// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import type { TextKey } from "@/services/i18n.service";
import { useSportsController } from "./sports.controller";
export function Sports(p: { t: (key: TextKey) => string }) {
  const c = useSportsController();
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="sports-title">
      <h2 id="sports-title">{t("sportsSection")}</h2>
      <p className="field-hint">{t("sportsHint")}</p>
      {c.message && (
        <p
          role={c.message.error ? "alert" : "status"}
          className={c.message.error ? "error-text" : "success-message"}
        >
          {t(c.message.key)}
        </p>
      )}
      {c.sports.isPending ? (
        <Feedback message={t("loading")} />
      ) : (
        <div className="table-scroll">
          <table className="sports-table">
            <caption className="sr-only">{t("sportsSection")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("sportNameGl")}</th>
                <th scope="col">{t("sportNameEs")}</th>
                <th scope="col">{t("sportCnid")}</th>
                <th scope="col">{t("sportHidden")}</th>
                <th scope="col">
                  <span className="sr-only">{t("save")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((sport) => (
                <tr key={sport.code}>
                  <td>
                    <Input
                      size="sm"
                      aria-label={`${t("sportNameGl")}: ${sport.code}`}
                      value={sport.name.gl}
                      maxLength={60}
                      onChange={(event) =>
                        c.edit(sport.code, {
                          name: { ...sport.name, gl: event.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <Input
                      size="sm"
                      aria-label={`${t("sportNameEs")}: ${sport.code}`}
                      value={sport.name.es}
                      maxLength={60}
                      onChange={(event) =>
                        c.edit(sport.code, {
                          name: { ...sport.name, es: event.target.value },
                        })
                      }
                    />
                  </td>
                  <td className="muted small">{sport.cnidType}</td>
                  <td>
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={sport.hidden}
                        onChange={(event) =>
                          c.edit(sport.code, { hidden: event.target.checked })
                        }
                      />
                      <span className="sr-only">
                        {t("sportHidden")}: {sport.name.gl}
                      </span>
                    </label>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`${t("save")}: ${sport.name.gl}`}
                      disabled={!c.changed(sport.code) || c.pending}
                      onClick={() => {
                        void c.save(sport.code);
                      }}
                    >
                      {t("save")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form
        className="inline-form"
        aria-label={t("sportAdd")}
        noValidate
        onSubmit={(event) => {
          void c.add(event);
        }}
      >
        <Field.Root className="field" required>
          <Field.Label>
            {t("sportNameGl")} <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={c.draft.gl}
            maxLength={60}
            onChange={(event) => c.setDraft({ gl: event.target.value })}
          />
          {c.code && (
            <Field.HelperText>
              {t("sportCode")}: {c.code}
            </Field.HelperText>
          )}
        </Field.Root>
        <Field.Root className="field">
          <Field.Label>{t("sportNameEs")}</Field.Label>
          <Input
            value={c.draft.es}
            maxLength={60}
            onChange={(event) => c.setDraft({ es: event.target.value })}
          />
        </Field.Root>
        <Button type="submit" colorPalette="court" loading={c.pending}>
          {t("sportAdd")}
        </Button>
      </form>
    </section>
  );
}
