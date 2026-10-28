// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Button,
  Dialog,
  Field,
  Input,
  NativeSelect,
  Portal,
  Textarea,
} from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
import {
  TIMEZONES,
  useMunicipalityFormController,
} from "./municipality-form.controller";
export function MunicipalityForm(p: {
  t: (key: TextKey) => string;
  locale: Locale;
  onClose: (name?: string) => void;
}) {
  const c = useMunicipalityFormController(p);
  const { t } = p;
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open && !c.mutation.isPending) p.onClose();
      }}
      placement="center"
      size="lg"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal editor-modal">
            <Dialog.Header>
              <Dialog.Title>{t("operatorNewMunicipality")}</Dialog.Title>
              <Dialog.Description className="modal-description">
                {t("operatorNewMunicipalityHint")}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="municipality-form"
                noValidate
                onSubmit={(event) => {
                  void c.save(event);
                }}
              >
                <div className="form-grid">
                  <Field.Root
                    className="field full"
                    required
                    invalid={!!c.errors.name}
                  >
                    <Field.Label>
                      {t("operatorMunicipalityName")}
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      name="name"
                      maxLength={120}
                      value={c.draft.name}
                      onChange={(event) => c.setName(event.target.value)}
                    />
                    {c.errors.name && (
                      <Field.ErrorText>{t(c.errors.name)}</Field.ErrorText>
                    )}
                  </Field.Root>
                  <Field.Root
                    className="field"
                    required
                    invalid={!!c.errors.slug}
                  >
                    <Field.Label>
                      {t("operatorSlug")}
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      name="slug"
                      maxLength={64}
                      spellCheck={false}
                      value={c.draft.slug}
                      onChange={(event) => c.setSlug(event.target.value)}
                    />
                    <Field.HelperText>{t("operatorSlugHint")}</Field.HelperText>
                    {c.errors.slug && (
                      <Field.ErrorText>{t(c.errors.slug)}</Field.ErrorText>
                    )}
                  </Field.Root>
                  <Field.Root className="field">
                    <Field.Label>{t("operatorTimezone")}</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="timezone"
                        value={c.draft.timezone}
                        onChange={(event) =>
                          c.update({ timezone: event.target.value })
                        }
                      >
                        {TIMEZONES.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  <Field.Root className="field">
                    <Field.Label>{t("defaultLanguage")}</Field.Label>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="locale"
                        value={c.draft.locale}
                        onChange={(event) =>
                          c.update({
                            locale: event.target.value === "es" ? "es" : "gl",
                          })
                        }
                      >
                        <option value="gl">{t("galician")}</option>
                        <option value="es">{t("spanish")}</option>
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  </Field.Root>
                  <Field.Root
                    className="field"
                    required
                    invalid={!!c.errors.contact}
                  >
                    <Field.Label>
                      {t("contactLabel")}
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      name="contact"
                      maxLength={500}
                      value={c.draft.contact}
                      onChange={(event) =>
                        c.update({ contact: event.target.value }, "contact")
                      }
                    />
                    {c.errors.contact && (
                      <Field.ErrorText>{t(c.errors.contact)}</Field.ErrorText>
                    )}
                  </Field.Root>
                  {(
                    [
                      ["gl", "legalGl"],
                      ["es", "legalEs"],
                    ] as const
                  ).map(([language, label]) => (
                    <Field.Root
                      key={language}
                      className="field full"
                      required
                      invalid={!!c.errors[`legal-${language}`]}
                    >
                      <Field.Label>
                        {t(label)}
                        <Field.RequiredIndicator />
                      </Field.Label>
                      <Textarea
                        name={`legal-${language}`}
                        lang={language}
                        rows={4}
                        maxLength={20000}
                        value={c.draft.legalTexts[language]}
                        onChange={(event) =>
                          c.update(
                            {
                              legalTexts: {
                                ...c.draft.legalTexts,
                                [language]: event.target.value,
                              },
                            },
                            `legal-${language}`,
                          )
                        }
                      />
                      {c.errors[`legal-${language}`] && (
                        <Field.ErrorText>{t("legalError")}</Field.ErrorText>
                      )}
                    </Field.Root>
                  ))}
                </div>
                <p className="notice">{t("operatorNewMunicipalityNote")}</p>
                {c.mutation.error && (
                  <p role="alert" className="error-text">
                    {c.mutation.error.message}
                  </p>
                )}
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                onClick={() => p.onClose()}
                disabled={c.mutation.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                colorPalette="court"
                type="submit"
                form="municipality-form"
                loading={c.mutation.isPending}
              >
                {t("operatorCreateMunicipality")}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button variant="ghost" size="md" px="0" aria-label={t("close")}>
                <PiX size={20} aria-hidden="true" />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
