// SPDX-License-Identifier: AGPL-3.0-or-later
import { Feedback } from "@/components/feedback/feedback.view";
import type { TextKey } from "@/services/i18n.service";
import type { Municipality, SlotSuggestion } from "@/types/models";
import { useSlotSuggestionsController } from "./slot-suggestions.controller";
export function SlotSuggestions(p: {
  municipality: Municipality;
  facilityId: string;
  date: string;
  /** The start the person wanted, when a booking failed. */
  around: string | null;
  t: (key: TextKey) => string;
  onPick: (suggestion: SlotSuggestion) => void;
}) {
  const c = useSlotSuggestionsController(p);
  return (
    <section className="slot-suggestions" aria-labelledby="suggestions-title">
      <h3 id="suggestions-title">{p.t("suggestionsTitle")}</h3>
      <p className="muted small">{p.t("suggestionsIntro")}</p>
      {c.query.isPending ? (
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
      ) : c.items.length ? (
        <ol className="suggestion-list">
          {c.items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className="suggestion"
                aria-label={item.label}
                onClick={() => p.onPick(item.suggestion)}
              >
                <strong>{item.time}</strong>
                <span>
                  {item.place} · {item.suggestion.resourceName}
                </span>
                <span className="muted small">{item.usual}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p>{p.t("suggestionsEmpty")}</p>
      )}
    </section>
  );
}
