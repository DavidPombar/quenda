// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button } from "@chakra-ui/react";
import { categoryLabel } from "@/services/tariff.service";
import type { TextKey } from "@/services/i18n.service";
import type { MunicipalitySettings } from "@/types/models";
import { useUserCategoriesController } from "./user-categories.controller";
export function UserCategories(p: {
  settings: MunicipalitySettings;
  t: (key: TextKey) => string;
}) {
  const c = useUserCategoriesController(p);
  const { t } = p;
  return (
    <section className="settings-section" aria-labelledby="categories-title">
      <h2 id="categories-title">{t("categoriesSection")}</h2>
      <p className="field-hint">{t("categoriesHint")}</p>
      <fieldset className="form-section">
        <legend className="sr-only">{t("categoriesSection")}</legend>
        <div className="category-options">
          {c.categories.map((category) => (
            <label key={category} className="checkbox-field">
              <input
                type="checkbox"
                checked={c.enabled.includes(category)}
                onChange={(event) => c.toggle(category, event.target.checked)}
              />
              {t(categoryLabel(category))}
            </label>
          ))}
        </div>
      </fieldset>
      {c.enabled.includes("disability") && (
        <p className="notice">{t("categoriesSensitive")}</p>
      )}
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
        {c.mutation.isError && (
          <p role="alert" className="error-text">
            {c.mutation.error.message}
          </p>
        )}
      </div>
    </section>
  );
}
