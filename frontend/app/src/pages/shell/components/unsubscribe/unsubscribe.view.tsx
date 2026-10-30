// SPDX-License-Identifier: AGPL-3.0-or-later
import { Link } from "react-router-dom";
import { Button } from "@chakra-ui/react";
import { useUnsubscribeController } from "./unsubscribe.controller";
export function Unsubscribe() {
  const c = useUnsubscribeController();
  return (
    <div className="page account-page">
      <h1>{c.t("unsubscribeTitle")}</h1>
      {c.done ? (
        <p role="status" className="success-body">
          {c.done}
        </p>
      ) : c.invalid ? (
        <p role="alert" className="error-text">
          {c.t(c.stale ? "unsubscribeStale" : "unsubscribeError")}
        </p>
      ) : (
        <>
          <p className="page-subtitle">{c.t("unsubscribeBody")}</p>
          <Button
            colorPalette="court"
            size="lg"
            alignSelf="flex-start"
            loading={c.unsubscribe.isPending}
            onClick={c.confirm}
          >
            {c.t("unsubscribeConfirm")}
          </Button>
        </>
      )}
      <p>
        <Link className="text-button" to={c.accountPath}>
          {c.t("unsubscribeAccount")}
        </Link>
      </p>
    </div>
  );
}
