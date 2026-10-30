// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { TemporaryPassword } from "@/components/temporary-password/temporary-password.view";
import { useStaffController } from "./staff.controller";
export function Staff() {
  const c = useStaffController();
  const { t } = c;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("staff")}</h1>
          <p className="page-subtitle">{t("staffSubtitle")}</p>
        </div>
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{t("managerOnly")}</h2>
          <p>{t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {t("signIn")}
          </Button>
        </div>
      ) : c.staff.isError ? (
        <Feedback
          message={t("loadError")}
          error
          retryLabel={t("retry")}
          retry={() => {
            void c.staff.refetch();
          }}
        />
      ) : c.staff.isPending ? (
        <Feedback message={t("loading")} />
      ) : (
        <div className="settings-sections">
          {c.notice && (
            <p role="status" className="success-message">
              {c.notice}
            </p>
          )}
          {c.error && (
            <p role="alert" className="error-text">
              {t(c.error)}
            </p>
          )}
          <section
            className="settings-section"
            aria-labelledby="door-staff-title"
          >
            <h2 id="door-staff-title">{t("staffDoor")}</h2>
            <p className="field-hint">{t("staffDoorHint")}</p>
            {c.doorStaff.length === 0 ? (
              <p className="muted">{t("staffDoorEmpty")}</p>
            ) : (
              <div className="table-scroll">
                <table className="staff-table">
                  <caption className="sr-only">{t("staffDoor")}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{t("staffName")}</th>
                      <th scope="col">{t("staffLogin")}</th>
                      <th scope="col">{t("staffState")}</th>
                      <th scope="col">
                        <span className="sr-only">{t("staffActions")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.doorStaff.map((person) => (
                      <tr key={person.userId}>
                        <th scope="row">{person.displayName}</th>
                        <td>
                          <code>{person.login ?? "—"}</code>
                        </td>
                        <td>
                          {t(
                            !person.login
                              ? "staffStateNoAccount"
                              : person.disabled
                                ? "staffStateDisabled"
                                : person.enrolled
                                  ? "staffStateActive"
                                  : "staffStatePending",
                          )}
                        </td>
                        <td className="staff-actions">
                          {person.login && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={c.pending}
                              aria-label={`${t("staffReset")}: ${person.displayName}`}
                              onClick={() => {
                                void c.update(person, "reset");
                              }}
                            >
                              {t("staffReset")}
                            </Button>
                          )}
                          {person.login && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={c.pending}
                              aria-label={`${t(person.disabled ? "staffEnable" : "staffDisable")}: ${person.displayName}`}
                              onClick={() => {
                                void c.update(
                                  person,
                                  person.disabled ? "enable" : "disable",
                                );
                              }}
                            >
                              {t(
                                person.disabled
                                  ? "staffEnable"
                                  : "staffDisable",
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <form
              className="inline-form"
              aria-label={t("staffAddDoor")}
              noValidate
              onSubmit={(event) => {
                void c.create(event);
              }}
            >
              <Field.Root className="field" required>
                <Field.Label>
                  {t("staffName")} <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  maxLength={120}
                  value={c.draft.displayName}
                  onChange={(event) =>
                    c.edit({ displayName: event.target.value })
                  }
                />
              </Field.Root>
              <Field.Root className="field" required>
                <Field.Label>
                  {t("staffLogin")} <Field.RequiredIndicator />
                </Field.Label>
                <Input
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={64}
                  value={c.draft.login}
                  onChange={(event) => c.edit({ login: event.target.value })}
                />
              </Field.Root>
              <Button type="submit" colorPalette="court" loading={c.pending}>
                {t("staffAddDoor")}
              </Button>
            </form>
          </section>
          <section
            className="settings-section"
            aria-labelledby="managers-title"
          >
            <h2 id="managers-title">{t("staffManagers")}</h2>
            <p className="field-hint">{t("staffManagersHint")}</p>
            <ul className="staff-managers">
              {c.managers.map((person) => (
                <li key={person.userId}>
                  {person.displayName}
                  {person.login && (
                    <>
                      {" · "}
                      <code>{person.login}</code>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {c.shown && (
        <TemporaryPassword
          t={t}
          name={c.shown.name}
          login={c.shown.login}
          password={c.shown.password}
          onClose={c.closeShown}
        />
      )}
    </div>
  );
}
