// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Checkbox, Field, NativeSelect } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { categoryLabel, categoryStatusLabel } from "@/services/tariff.service";
import type { Municipality } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
import { useUserCategoriesController } from "./user-categories.controller";
export function UserCategories(p: {
  userId: string;
  municipality: Municipality;
  t: (key: TextKey) => string;
}) {
  const c = useUserCategoriesController(p);
  return (
    <section className="account-section" aria-labelledby="categories-title">
      <h2 id="categories-title">{p.t("categoriesSection")}</h2>
      {!c.offered ? (
        <p>{p.t("categoriesUnavailable")}</p>
      ) : c.query.isPending ? (
        <Feedback message={p.t("loading")} />
      ) : c.query.isError ? (
        <Feedback
          message={p.t("loadError")}
          error
          retryLabel={p.t("retry")}
          retry={() => {
            void c.query.refetch();
          }}
        />
      ) : (
        <>
          <p>{p.t("categoriesBody")}</p>
          {c.mine.length === 0 ? (
            <p className="muted">{p.t("categoriesNone")}</p>
          ) : (
            <dl className="facts">
              {c.mine.map((entry) => (
                <div key={entry.category}>
                  <dt>{p.t(categoryLabel(entry.category))}</dt>
                  <dd>
                    <span className={`category-status ${entry.status}`}>
                      {p.t(categoryStatusLabel(entry.status))}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {c.familyVerified && (
            <Field.Root>
              <Checkbox.Root
                checked={c.prefersFamily}
                disabled={c.preference.isPending}
                onCheckedChange={(event) =>
                  c.setPrefersFamily(event.checked === true)
                }
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>{p.t("familyPreference")}</Checkbox.Label>
              </Checkbox.Root>
              <Field.HelperText>{p.t("familyPreferenceHint")}</Field.HelperText>
            </Field.Root>
          )}
          {c.options.length > 0 && (
            <form
              className="category-request"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void c.submit();
              }}
            >
              <Field.Root>
                <Field.Label>{p.t("categoryField")}</Field.Label>
                <NativeSelect.Root size="lg">
                  <NativeSelect.Field
                    name="category"
                    value={c.choice}
                    onChange={(event) => c.setChoice(event.target.value)}
                  >
                    <option value="">{p.t("chooseCategory")}</option>
                    {c.options.map((category) => (
                      <option key={category} value={category}>
                        {p.t(categoryLabel(category))}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>
              <Button
                type="submit"
                variant="outline"
                size="lg"
                alignSelf="flex-start"
                disabled={!c.choice}
                loading={c.request.isPending}
              >
                {p.t("requestCategory")}
              </Button>
            </form>
          )}
          {c.request.isSuccess && (
            <p role="status" className="success-body">
              {p.t("categoryRequestSent")}
            </p>
          )}
          {c.request.isError && (
            <p role="alert" className="error-text">
              {c.request.error.message}
            </p>
          )}
        </>
      )}
    </section>
  );
}
