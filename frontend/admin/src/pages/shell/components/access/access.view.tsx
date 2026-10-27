// SPDX-License-Identifier: AGPL-3.0-or-later
import { Button, Field, Input } from "@chakra-ui/react";
import { PiWifiHigh, PiWifiSlash } from "react-icons/pi";
import { Feedback } from "@/components/feedback/feedback.view";
import { SpotArt } from "@/components/spot-art/spot-art.view";
import { useAccessController } from "./access.controller";
import { CameraScanner } from "./components/camera-scanner/camera-scanner.view";
import { ScanResult } from "./components/scan-result/scan-result.view";
export function Access() {
  const c = useAccessController();
  return (
    <div className="page access-page">
      <div className="page-heading">
        <div>
          <h1>{c.t("accessControl")}</h1>
          <p className="page-subtitle">{c.t("accessSubtitle")}</p>
        </div>
      </div>
      {!c.allowed ? (
        <div className="empty-state">
          <SpotArt kind="access" />
          <h2>{c.t("staffOnly")}</h2>
          <p>{c.t("staffPrompt")}</p>
          <Button colorPalette="court" onClick={c.signIn}>
            {c.t("signIn")}
          </Button>
        </div>
      ) : (
        <>
          <p className={`connection ${c.online ? "online" : "offline"}`}>
            {c.online ? (
              <PiWifiHigh size={18} aria-hidden="true" />
            ) : (
              <PiWifiSlash size={18} aria-hidden="true" />
            )}
            {c.t(c.online ? "accessOnline" : "accessOffline")}
            {c.pending > 0 && (
              <>
                {" · "}
                {c.t("accessPending")}: {c.pending}
                {c.online && (
                  <Button size="xs" variant="outline" onClick={c.retrySync}>
                    {c.t("accessSyncNow")}
                  </Button>
                )}
              </>
            )}
          </p>
          <div aria-live="polite">
            {c.syncMessage && (
              <p role="status" className="success-message">
                {c.syncMessage}
              </p>
            )}
          </div>
          {c.keys.isError && !c.keys.data && (
            <Feedback
              message={c.t("accessNoKeys")}
              error
              retryLabel={c.t("retry")}
              retry={() => {
                void c.keys.refetch();
              }}
            />
          )}
          <div className="access-layout">
            <CameraScanner onCode={c.handleCode} t={c.t} />
            <div aria-live="assertive">
              {c.outcome ? (
                <ScanResult {...c.outcome} t={c.t} window={c.window} />
              ) : (
                <p className="muted">{c.t("accessWaiting")}</p>
              )}
            </div>
          </div>
          <form
            className="manual-code"
            onSubmit={(event) => {
              event.preventDefault();
              void c.submitManual();
            }}
          >
            <Field.Root className="field">
              <Field.Label>{c.t("accessManual")}</Field.Label>
              <Input
                value={c.manualCode}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => c.setManualCode(event.target.value)}
              />
              <Field.HelperText>{c.t("accessManualHint")}</Field.HelperText>
            </Field.Root>
            <Button
              type="submit"
              variant="outline"
              disabled={!c.manualCode.trim()}
            >
              {c.t("accessCheck")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
