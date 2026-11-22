import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SOURCE_URLS } from "../config";
import { electionPhase } from "./electionPhase";
import { ExternalLink } from "../design/ExternalLink";

const REFRESH_INTERVAL_MS = 60_000;

export function ElectionBanner(props: { now?: () => Date }) {
  const { t } = useTranslation("shell");
  const now = props.now ?? (() => new Date());
  const [phase, setPhase] = useState(() => electionPhase(now()));

  useEffect(() => {
    const timer = setInterval(
      () => setPhase(electionPhase(now())),
      REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  });

  if (phase === "before") return null;
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <p
        role="status"
        className="rounded-frame border border-kraft-rule bg-kraft px-4 py-2 text-center text-sm text-ink"
      >
        {phase === "electionDay" ? (
          t("electionBanner.today")
        ) : (
          <>
            {t("electionBanner.over")}{" "}
            <ExternalLink
              href={SOURCE_URLS.interior}
              className="inline-block min-h-11 py-3 font-medium text-accent underline"
            >
              {t("electionBanner.results")}
            </ExternalLink>
          </>
        )}
      </p>
    </div>
  );
}
