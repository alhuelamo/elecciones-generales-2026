import { useTranslation } from "react-i18next";
import { SOURCE_URLS } from "../config";
import { ExternalLink } from "../design/ExternalLink";

export function WhereToVote() {
  const { t } = useTranslation("constituency");
  return (
    <p className="text-sm text-ink-muted">
      {t("whereToVote.text")}{" "}
      <ExternalLink
        href={SOURCE_URLS.pollingStationLookup}
        className="inline-block min-h-11 py-3 text-accent underline"
      >
        {t("whereToVote.link")}
      </ExternalLink>
    </p>
  );
}
