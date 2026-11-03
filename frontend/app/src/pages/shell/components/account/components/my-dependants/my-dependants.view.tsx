// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  Button,
  Checkbox,
  Dialog,
  Field,
  Input,
  Portal,
} from "@chakra-ui/react";
import { PiPlus, PiX } from "react-icons/pi";
import { fill, type TextKey } from "@/services/i18n.service";
import type { Municipality } from "@/types/models";
import { useMyDependantsController } from "./my-dependants.controller";
/** People in the adult's care, whom they enrol in activities for their age (#97). */
export function MyDependants(p: {
  userId: string;
  municipality: Municipality;
  t: (key: TextKey) => string;
}) {
  const c = useMyDependantsController(p);
  const { t } = p;
  const people = c.query.data ?? [];
  return (
    <section className="account-section" aria-labelledby="my-dependants-title">
      <h2 id="my-dependants-title">{t("dependants")}</h2>
      <p>{t("dependantsBody")}</p>
      {people.length === 0 ? (
        <p className="muted">{t("dependantsEmpty")}</p>
      ) : (
        <ul className="dependant-list">
          {people.map((person) => (
            <li key={person.id}>
              <span>
                <strong>{person.firstName}</strong>{" "}
                <span className="muted">
                  {fill(t("dependantAge"), {
                    age: c.year - person.birthYear,
                    year: person.birthYear,
                  })}
                </span>
              </span>
              <span className="row-actions">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`${t("dependantEdit")}: ${person.firstName}`}
                  onClick={() => c.open(person)}
                >
                  {t("dependantEdit")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  aria-label={`${t("dependantRemove")}: ${person.firstName}`}
                  onClick={() => c.askRemove(person)}
                >
                  {t("dependantRemove")}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {c.editing ? (
        <form
          className="form-grid dependant-form"
          noValidate
          aria-labelledby="dependant-form-title"
          onSubmit={(event) => {
            void c.submit(event);
          }}
        >
          <h3 id="dependant-form-title" className="full">
            {c.editing === "new"
              ? t("dependantAdd")
              : fill(t("dependantEditing"), { name: c.editing.firstName })}
          </h3>
          <Field.Root
            className="field"
            required
            invalid={c.invalid && !c.firstName.trim()}
          >
            <Field.Label>
              {t("dependantFirstName")}
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              value={c.firstName}
              maxLength={60}
              autoComplete="off"
              onChange={(event) => c.setFirstName(event.target.value)}
            />
            <Field.HelperText>{t("dependantFirstNameHint")}</Field.HelperText>
          </Field.Root>
          <Field.Root className="field" required invalid={c.invalid}>
            <Field.Label>
              {t("dependantBirthYear")}
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="number"
              inputMode="numeric"
              min={c.year - 120}
              max={c.year}
              value={c.birthYear}
              onChange={(event) => c.setBirthYear(event.target.value)}
            />
            <Field.ErrorText>{t("dependantInvalid")}</Field.ErrorText>
          </Field.Root>
          {c.editing === "new" && (
            <Checkbox.Root
              className="full consent-check"
              colorPalette="court"
              size="lg"
              checked={c.declared}
              invalid={c.invalid && !c.declared}
              onCheckedChange={(event) => c.setDeclared(event.checked === true)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{t("dependantDeclaration")}</Checkbox.Label>
            </Checkbox.Root>
          )}
          <p className="full muted small">{t("dependantPrivacy")}</p>
          {c.save.error && (
            <p role="alert" className="full error-text">
              {c.save.error.message}
            </p>
          )}
          {c.invalid && (
            <p role="alert" className="full error-text">
              {t("dependantInvalid")}
            </p>
          )}
          <div className="full row-actions">
            <Button
              type="submit"
              colorPalette="court"
              loading={c.save.isPending}
            >
              {t("dependantSave")}
            </Button>
            <Button variant="outline" onClick={c.close}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      ) : (
        people.length < 10 && (
          <Button variant="outline" onClick={() => c.open("new")}>
            <PiPlus size={18} aria-hidden="true" />
            {t("dependantAdd")}
          </Button>
        )
      )}
      <Dialog.Root
        open={!!c.removing}
        role="alertdialog"
        placement="center"
        onOpenChange={(event) => {
          if (!event.open && !c.remove.isPending) c.cancelRemove();
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content className="modal">
              <Dialog.Header>
                <Dialog.Title>
                  {fill(t("dependantRemoveTitle"), {
                    name: c.removing?.firstName ?? "",
                  })}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>{t("dependantRemoveBody")}</p>
                {c.remove.error && (
                  <p role="alert" className="error-text">
                    {c.remove.error.message}
                  </p>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={c.cancelRemove}
                  disabled={c.remove.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  colorPalette="red"
                  loading={c.remove.isPending}
                  onClick={() => {
                    c.confirmRemove();
                  }}
                >
                  {t("dependantRemove")}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="ghost" size="md" aria-label={t("close")}>
                  <PiX size={20} aria-hidden="true" />
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </section>
  );
}
