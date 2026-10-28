// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import { PiCheck, PiMagnifyingGlass, PiX } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { dateLabel } from "@/services/date.service";
import { categoryLabel, categoryStatusLabel } from "@/services/tariff.service";
import { useCategoriesController } from "./categories.controller";
export function Categories() {
  const c = useCategoriesController();
  const { t } = c;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{t("categoriesTitle")}</h1>
          <p className="page-subtitle">{t("categoriesSubtitle")}</p>
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
      ) : !c.offered ? (
        <p className="notice">{t("categoriesDisabled")}</p>
      ) : (
        <div className="settings-sections">
          {c.saved && (
            <p role="status" className="success-message">
              {t("categoryUpdated")}
            </p>
          )}
          {c.error && (
            <p role="alert" className="error-text">
              {c.error}
            </p>
          )}
          <section
            className="settings-section"
            aria-labelledby="requests-title"
          >
            <h2 id="requests-title">{t("pendingRequests")}</h2>
            {c.requests.isPending ? (
              <Feedback message={t("loading")} />
            ) : c.requests.isError ? (
              <Feedback
                message={t("loadError")}
                error
                retryLabel={t("retry")}
                retry={() => {
                  void c.requests.refetch();
                }}
              />
            ) : c.requests.data.length === 0 ? (
              <p className="muted">{t("noPendingRequests")}</p>
            ) : (
              <ul className="category-list">
                {c.requests.data.map((request) => {
                  const label = `${request.displayName} · ${t(categoryLabel(request.category))}`;
                  return (
                    <li key={`${request.userId}-${request.category}`}>
                      <span>
                        <strong>{request.displayName}</strong>
                        <span className="muted">
                          {t(categoryLabel(request.category))} ·{" "}
                          {t("requestedOn")}{" "}
                          {dateLabel(
                            request.requestedAt,
                            c.municipality.timezone,
                            c.locale,
                          )}
                        </span>
                      </span>
                      <span className="category-actions">
                        <Button
                          size="sm"
                          colorPalette="court"
                          disabled={c.pending}
                          aria-label={`${t("verify")}: ${label}`}
                          onClick={() => {
                            void c.decide(
                              request.userId,
                              request.category,
                              "verified",
                            );
                          }}
                        >
                          <PiCheck size={16} aria-hidden="true" />
                          {t("verify")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={c.pending}
                          aria-label={`${t("reject")}: ${label}`}
                          onClick={() => {
                            void c.decide(
                              request.userId,
                              request.category,
                              "rejected",
                            );
                          }}
                        >
                          <PiX size={16} aria-hidden="true" />
                          {t("reject")}
                        </Button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section className="settings-section" aria-labelledby="assign-title">
            <h2 id="assign-title">{t("assignCategory")}</h2>
            <form
              className="citizen-search"
              noValidate
              onSubmit={c.submitSearch}
            >
              <Field.Root className="field">
                <Field.Label>{t("searchCitizens")}</Field.Label>
                <Input
                  name="query"
                  type="search"
                  maxLength={120}
                  value={c.search}
                  onChange={(event) => c.setSearch(event.target.value)}
                />
                <Field.HelperText>{t("searchCitizensHint")}</Field.HelperText>
              </Field.Root>
              <Button type="submit" variant="outline" alignSelf="flex-start">
                <PiMagnifyingGlass size={18} aria-hidden="true" />
                {t("searchButton")}
              </Button>
            </form>
            {c.query.length >= 2 &&
              (c.citizens.isPending ? (
                <Feedback message={t("loading")} />
              ) : c.citizens.isError ? (
                <Feedback message={t("loadError")} error />
              ) : c.citizens.data.length === 0 ? (
                <p className="muted">{t("noCitizens")}</p>
              ) : (
                <ul className="category-list">
                  {c.citizens.data.map((citizen) => (
                    <li key={citizen.userId} className="citizen-row">
                      <strong>{citizen.displayName}</strong>
                      {citizen.categories.length > 0 && (
                        <ul className="citizen-categories">
                          {citizen.categories.map((entry) => (
                            <li key={entry.category}>
                              <span>
                                {t(categoryLabel(entry.category))} ·{" "}
                                <span className="muted">
                                  {t(categoryStatusLabel(entry.status))}
                                </span>
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                colorPalette="red"
                                disabled={c.pending}
                                aria-label={`${t("revoke")}: ${citizen.displayName} · ${t(categoryLabel(entry.category))}`}
                                onClick={() => {
                                  void c.revoke(citizen.userId, entry.category);
                                }}
                              >
                                {t("revoke")}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {c.assignable(citizen).length > 0 && (
                        <div className="category-actions">
                          <NativeSelect.Root size="sm" maxWidth="18rem">
                            <NativeSelect.Field
                              aria-label={`${t("categories")}: ${citizen.displayName}`}
                              value={c.choiceFor(citizen.userId)}
                              onChange={(event) =>
                                c.choose(citizen.userId, event.target.value)
                              }
                            >
                              <option value="">—</option>
                              {c.assignable(citizen).map((category) => (
                                <option key={category} value={category}>
                                  {t(categoryLabel(category))}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                          <Button
                            size="sm"
                            colorPalette="court"
                            disabled={c.pending || !c.choiceFor(citizen.userId)}
                            aria-label={`${t("assign")}: ${citizen.displayName}`}
                            onClick={() => {
                              void c.assign(citizen.userId);
                            }}
                          >
                            {t("assign")}
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
          </section>
        </div>
      )}
    </div>
  );
}
