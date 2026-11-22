import { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { electionPhase } from "../shell/electionPhase";
import { daysUntilElection } from "./daysUntilElection";

const REFRESH_INTERVAL_MS = 60_000;

export function ElectionCountdown(props: { now?: () => Date }) {
  const now = props.now ?? (() => new Date());
  const [current, setCurrent] = useState(now);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(now()), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  });

  if (electionPhase(current) !== "before") return null;
  return (
    <p className="text-sm text-ink-muted">
      <Trans
        ns="home"
        i18nKey="countdown.before"
        count={daysUntilElection(current)}
        components={{ days: <span className="tabular-nums" /> }}
      />
    </p>
  );
}
