import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SOURCE_URLS } from "../config";
import { electionPhase } from "./electionPhase";

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
    <p
      role="status"
      className="bg-blue-100 px-4 py-2 text-center text-sm text-blue-950 dark:bg-blue-900 dark:text-blue-50"
    >
      {phase === "electionDay" ? (
        t("electionBanner.today")
      ) : (
        <>
          {t("electionBanner.over")}{" "}
          <a
            href={SOURCE_URLS.interior}
            rel="noopener noreferrer"
            className="inline-block min-h-11 py-3 font-medium underline"
          >
            {t("electionBanner.results")}
          </a>
        </>
      )}
    </p>
  );
}
