import { useTranslation } from "react-i18next";
import { SOURCE_URLS } from "../config";

export function WhereToVote() {
  const { t } = useTranslation("constituency");
  return (
    <p className="text-sm text-ink-muted">
      {t("whereToVote.text")}{" "}
      <a
        href={SOURCE_URLS.pollingStationLookup}
        rel="noopener noreferrer"
        className="inline-block min-h-11 py-3 text-accent underline"
      >
        {t("whereToVote.link")}
      </a>
    </p>
  );
}
