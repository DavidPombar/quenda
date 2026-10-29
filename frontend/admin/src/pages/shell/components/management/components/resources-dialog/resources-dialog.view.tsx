// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Button,
  Dialog,
  Field,
  Input,
  NativeSelect,
  Portal,
} from "@chakra-ui/react";
import { PiArrowDown, PiArrowUp, PiPlus, PiTrash, PiX } from "react-icons/pi";
import type { Facility } from "@/types/models";
import type { TextKey } from "@/services/i18n.service";
import { useResourcesDialogController } from "./resources-dialog.controller";
export function ResourcesDialog(p: {
  facility: Facility;
  t: (key: TextKey) => string;
  onClose: (saved?: boolean) => void;
}) {
  const c = useResourcesDialogController(p);
  const { t } = p;
  return (
    <Dialog.Root
      open
      onOpenChange={(event) => {
        if (!event.open && !c.mutation.isPending) p.onClose();
      }}
      placement="center"
      size="xl"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="modal editor-modal">
            <Dialog.Header>
              <Dialog.Title>{t("resources")}</Dialog.Title>
              <Dialog.Description className="modal-description">
                {p.facility.name}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <form
                id="resources-form"
                noValidate
                onSubmit={(event) => {
                  void c.save(event);
                }}
              >
                <p className="field-hint">{t("resourcesHint")}</p>
                <ol className="resource-rows">
                  {c.rows.map((row, index) => (
                    <li
                      key={row.id}
                      className={
                        row.parentId ? "resource-row part" : "resource-row"
                      }
                    >
                      <fieldset>
                        <legend className="sr-only">
                          {row.name || t("resourceName")}
                        </legend>
                        <Field.Root
                          className="field"
                          required
                          invalid={c.invalid && !row.name.trim()}
                        >
                          <Field.Label>{t("resourceName")}</Field.Label>
                          <Input
                            data-resource={row.id}
                            maxLength={80}
                            value={row.name}
                            onChange={(event) =>
                              c.update(row.id, { name: event.target.value })
                            }
                          />
                        </Field.Root>
                        {c.hasParts(row.id) ? (
                          <p className="resource-parts">
                            {t("resourceHasParts")}
                          </p>
                        ) : (
                          <Field.Root className="field">
                            <Field.Label>{t("resourcePartOf")}</Field.Label>
                            <NativeSelect.Root>
                              <NativeSelect.Field
                                value={row.parentId ?? ""}
                                onChange={(event) =>
                                  c.update(row.id, {
                                    parentId: event.target.value || null,
                                  })
                                }
                              >
                                <option value="">
                                  {t("resourceIndependent")}
                                </option>
                                {c.parents(row.id).map((parent) => (
                                  <option key={parent.id} value={parent.id}>
                                    {parent.name || "—"}
                                  </option>
                                ))}
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Field.Root>
                        )}
                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={row.active}
                            onChange={(event) =>
                              c.update(row.id, { active: event.target.checked })
                            }
                          />
                          {t("resourceActive")}
                        </label>
                        <div className="resource-actions">
                          <Button
                            variant="ghost"
                            size="md"
                            px="0"
                            disabled={index === 0}
                            onClick={() => c.move(index, -1)}
                            aria-label={`${t("moveUp")}: ${row.name}`}
                          >
                            <PiArrowUp size={18} aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="md"
                            px="0"
                            disabled={index === c.rows.length - 1}
                            onClick={() => c.move(index, 1)}
                            aria-label={`${t("moveDown")}: ${row.name}`}
                          >
                            <PiArrowDown size={18} aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="md"
                            px="0"
                            colorPalette="red"
                            disabled={c.rows.length === 1}
                            onClick={() => c.remove(row.id)}
                            aria-label={`${t("removeResource")}: ${row.name}`}
                          >
                            <PiTrash size={18} aria-hidden="true" />
                          </Button>
                        </div>
                      </fieldset>
                    </li>
                  ))}
                </ol>
                <Button type="button" variant="outline" onClick={c.add}>
                  <PiPlus size={18} aria-hidden="true" />
                  {t("addResource")}
                </Button>
                {c.invalid && (
                  <p role="alert" className="error-text">
                    {t("resourceNameRequired")}
                  </p>
                )}
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
                form="resources-form"
                loading={c.mutation.isPending}
              >
                {t("save")}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button
                variant="ghost"
                size="md"
                px="0"
                aria-label={t("close")}
                disabled={c.mutation.isPending}
              >
                <PiX size={20} aria-hidden="true" />
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
