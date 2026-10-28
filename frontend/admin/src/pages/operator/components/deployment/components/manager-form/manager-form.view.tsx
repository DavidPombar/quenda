// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Dialog, Field, Input, Portal } from "@chakra-ui/react";
import { PiX } from "react-icons/pi";
import type { TextKey } from "@/services/i18n.service";
import type { DeploymentMunicipality } from "@/types/models";
import { useManagerFormController } from "./manager-form.controller";
export function ManagerForm(p: {
  t: (key: TextKey) => string;
  municipality: DeploymentMunicipality;
  onClose: (name?: string) => void;
}) {
  const c = useManagerFormController(p);
  const { t } = p;
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open && !c.mutation.isPending) p.onClose();
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal">
            <Dialog.Header>
              <Dialog.Title>{t("operatorAddManager")}</Dialog.Title>
              <Dialog.Description className="modal-description">
                {p.municipality.settings.name}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="manager-form"
                noValidate
                onSubmit={(event) => {
                  void c.save(event);
                }}
              >
                <div className="form-grid">
                  <Field.Root
                    className="field full"
                    required
                    invalid={!!c.errors.displayName}
                  >
                    <Field.Label>
                      {t("operatorManagerName")}
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      name="displayName"
                      maxLength={120}
                      value={c.draft.displayName}
                      onChange={(event) =>
                        c.setField("displayName", event.target.value)
                      }
                    />
                    {c.errors.displayName && (
                      <Field.ErrorText>
                        {t(c.errors.displayName)}
                      </Field.ErrorText>
                    )}
                  </Field.Root>
                  <Field.Root
                    className="field full"
                    required
                    invalid={!!c.errors.email}
                  >
                    <Field.Label>
                      {t("operatorManagerEmail")}
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                      name="email"
                      type="email"
                      autoComplete="off"
                      maxLength={254}
                      value={c.draft.email}
                      onChange={(event) =>
                        c.setField("email", event.target.value)
                      }
                    />
                    <Field.HelperText>
                      {t("operatorManagerEmailHint")}
                    </Field.HelperText>
                    {c.errors.email && (
                      <Field.ErrorText>{t(c.errors.email)}</Field.ErrorText>
                    )}
                  </Field.Root>
                </div>
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
                form="manager-form"
                loading={c.mutation.isPending}
              >
                {t("operatorAddManager")}
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
