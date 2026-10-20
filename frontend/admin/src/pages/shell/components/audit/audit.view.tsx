// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input, NativeSelect } from "@chakra-ui/react";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { useAuditController } from "./audit.controller";
export function Audit() {
  const c = useAuditController();
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <h1>{c.t("audit")}</h1>
          <p className="page-subtitle">{c.t("auditSubtitle")}</p>
        </div>
      </div>
      {!c.isManager ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("managerOnly")}</h2>
          <p>{c.t("managerPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : c.forbidden ? (
        <div className="empty-state" role="alert">
          <SpotArt kind="access" />
          <h2>{c.t("auditForbidden")}</h2>
          <p>{c.t("auditForbiddenBody")}</p>
        </div>
      ) : (
        <>
          <form
            className="audit-filters"
            aria-label={c.t("auditFilters")}
            onSubmit={(event) => event.preventDefault()}
          >
            <Field.Root className="field">
              <Field.Label>{c.t("auditAction")}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={c.action}
                  onChange={(event) =>
                    c.setFilter("action", event.target.value)
                  }
                >
                  <option value="">{c.t("auditAllActions")}</option>
                  {c.actions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {c.t(label)}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root className="field">
              <Field.Label>{c.t("auditFrom")}</Field.Label>
              <Input
                type="date"
                value={c.from}
                max={c.to || undefined}
                onChange={(event) => c.setFilter("from", event.target.value)}
              />
            </Field.Root>
            <Field.Root className="field" invalid={c.rangeInvalid}>
              <Field.Label>{c.t("auditTo")}</Field.Label>
              <Input
                type="date"
                value={c.to}
                min={c.from || undefined}
                onChange={(event) => c.setFilter("to", event.target.value)}
              />
              {c.rangeInvalid && (
                <Field.ErrorText>{c.t("auditRangeError")}</Field.ErrorText>
              )}
            </Field.Root>
          </form>
          {c.rangeInvalid ? null : c.events.isError ? (
            <Feedback
              message={c.t("loadError")}
              error
              retryLabel={c.t("retry")}
              retry={() => {
                void c.events.refetch();
              }}
            />
          ) : c.events.isPending ? (
            <Feedback message={c.t("loading")} />
          ) : c.events.data.length === 0 ? (
            <div className="empty-state">
              <SpotArt kind="search" size="sm" />
              <h2>{c.t(c.hasFilters ? "auditEmpty" : "auditNone")}</h2>
              <p>{c.t(c.hasFilters ? "auditEmptyBody" : "auditNoneBody")}</p>
              {c.hasFilters && (
                <Button variant="outline" onClick={c.clearFilters}>
                  {c.t("auditClear")}
                </Button>
              )}
            </div>
          ) : (
            <div
              className="table-scroll"
              role="region"
              aria-labelledby="audit-caption"
              tabIndex={0}
            >
              <table className="audit-table">
                <caption id="audit-caption">{c.t("auditCaption")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{c.t("auditDate")}</th>
                    <th scope="col">{c.t("auditAction")}</th>
                    <th scope="col">{c.t("auditActor")}</th>
                    <th scope="col">{c.t("auditResource")}</th>
                    <th scope="col">{c.t("auditDetails")}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.events.data.map((event) => (
                    <tr key={event.id}>
                      <td className="audit-time">
                        <time dateTime={event.occurredAt}>
                          {c.occurredAt(event)}
                        </time>
                      </td>
                      <th scope="row">{c.actionLabel(event)}</th>
                      <td>
                        <span className="audit-actor">
                          {c.actorLabel(event)}
                        </span>
                        {c.roleLabel(event) && (
                          <span className="audit-role">
                            {c.roleLabel(event)}
                          </span>
                        )}
                      </td>
                      <td>
                        <code title={event.resourceId}>
                          {c.shortId(event.resourceId)}
                        </code>
                      </td>
                      <td>
                        {event.details ? (
                          <details className="audit-details">
                            <summary>{c.t("auditShowDetails")}</summary>
                            <pre>{c.formatDetails(event.details)}</pre>
                          </details>
                        ) : (
                          <span className="audit-role">
                            {c.t("auditNoDetails")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
