// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import {
  PiArrowDown,
  PiArrowUp,
  PiCaretRight,
  PiPlus,
  PiTrash,
} from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import type { TextKey } from "@/services/i18n.service";
import { useSportsController } from "./sports.controller";
export function Sports(p: {
  userId: string | undefined;
  t: (key: TextKey) => string;
}) {
  const c = useSportsController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="sports-title">
      <h2 id="sports-title">{t("sportsSection")}</h2>
      <p className="field-hint">{t("sportsHint")}</p>
      {c.query.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.query.refetch();
          }}
        />
      ) : c.query.isPending ? (
        <Feedback message={t("loading")} />
      ) : (
        <ol className="sport-rows">
          {c.rows.map((row, index) => (
            <li key={row.key} className="sport-row">
              <fieldset>
                <legend className="sr-only">
                  {row.nameGl || t("sportNew")}
                </legend>
                <Field.Root className="field">
                  <Field.Label>{t("sportNameGl")}</Field.Label>
                  <Input
                    data-sport={row.key}
                    maxLength={80}
                    value={row.nameGl}
                    onChange={(event) =>
                      c.update(row.key, { nameGl: event.target.value })
                    }
                  />
                </Field.Root>
                <Field.Root className="field">
                  <Field.Label>{t("sportNameEs")}</Field.Label>
                  <Input
                    maxLength={80}
                    value={row.nameEs}
                    onChange={(event) =>
                      c.update(row.key, { nameEs: event.target.value })
                    }
                  />
                </Field.Root>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={row.visible}
                    onChange={(event) =>
                      c.update(row.key, { visible: event.target.checked })
                    }
                  />
                  {t("sportVisible")}
                </label>
                <div className="sport-actions">
                  <Button
                    variant="ghost"
                    size="md"
                    px="0"
                    disabled={index === 0}
                    onClick={() => c.move(index, -1)}
                    aria-label={`${t("sportMoveUp")}: ${row.nameGl}`}
                  >
                    <PiArrowUp size={18} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    px="0"
                    disabled={index === c.rows.length - 1}
                    onClick={() => c.move(index, 1)}
                    aria-label={`${t("sportMoveDown")}: ${row.nameGl}`}
                  >
                    <PiArrowDown size={18} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    px="0"
                    colorPalette="red"
                    onClick={() => c.remove(row.key)}
                    aria-label={`${t("removeSport")}: ${row.nameGl}`}
                  >
                    <PiTrash size={18} aria-hidden="true" />
                  </Button>
                </div>
                <details className="disclosure sport-details">
                  <summary>
                    <PiCaretRight size={18} aria-hidden="true" />
                    {t("sportClassification")}
                  </summary>
                  <div className="disclosure-body form-grid">
                    <Field.Root className="field">
                      <Field.Label>{t("sportCode")}</Field.Label>
                      <Input
                        value={row.code}
                        readOnly={!row.isNew}
                        maxLength={40}
                        onChange={(event) =>
                          c.update(row.key, { code: event.target.value })
                        }
                      />
                      <Field.HelperText>{t("sportCodeHint")}</Field.HelperText>
                    </Field.Root>
                    <Field.Root className="field">
                      <Field.Label>{t("sportCnidClass")}</Field.Label>
                      <Input
                        maxLength={80}
                        value={row.cnidClass}
                        onChange={(event) =>
                          c.update(row.key, { cnidClass: event.target.value })
                        }
                      />
                    </Field.Root>
                    <Field.Root className="field">
                      <Field.Label>{t("sportCnidType")}</Field.Label>
                      <Input
                        maxLength={80}
                        value={row.cnidType}
                        onChange={(event) =>
                          c.update(row.key, { cnidType: event.target.value })
                        }
                      />
                    </Field.Root>
                    <Field.Root className="field">
                      <Field.Label>{t("sportSchemaType")}</Field.Label>
                      <Input
                        maxLength={60}
                        value={row.schemaType}
                        onChange={(event) =>
                          c.update(row.key, { schemaType: event.target.value })
                        }
                      />
                    </Field.Root>
                  </div>
                </details>
              </fieldset>
            </li>
          ))}
        </ol>
      )}
      <Button type="button" variant="outline" onClick={c.add}>
        <PiPlus size={18} aria-hidden="true" />
        {t("addSport")}
      </Button>
      <div className="settings-actions">
        <Button
          colorPalette="court"
          loading={c.mutation.isPending}
          disabled={!c.dirty}
          onClick={() => {
            void c.save();
          }}
        >
          {t("save")}
        </Button>
        {c.saved && (
          <p role="status" className="success-message">
            {t("settingsSaved")}
          </p>
        )}
        {c.invalid && (
          <p role="alert" className="error-text">
            {t("sportsInvalid")}
          </p>
        )}
        {c.mutation.isError && (
          <p role="alert" className="error-text">
            {c.mutation.error.message}
          </p>
        )}
      </div>
    </section>
  );
}
