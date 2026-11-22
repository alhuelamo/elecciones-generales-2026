import { useTranslation } from "react-i18next";
import { ExternalLink } from "../design/ExternalLink";
import type { Language } from "../i18n/languages";
import { translationIssueUrl } from "./translationIssueUrl";

const MACHINE_TRANSLATED_LANGUAGES: ReadonlySet<Language> = new Set([
  "eu",
  "gl",
]);

export function MachineTranslationNotice(props: { language: Language }) {
  const { t } = useTranslation("shell");
  const { language } = props;
  if (!MACHINE_TRANSLATED_LANGUAGES.has(language)) return null;

  const href = translationIssueUrl({
    title: t("machineTranslation.issueTitle", { language }),
    body: t("machineTranslation.issueBody", {
      language,
      page: window.location.href,
    }),
  });
  return (
    <div className="mx-auto max-w-3xl px-4 pt-2">
      <p className="text-center text-sm leading-snug text-ink-muted">
        {t("machineTranslation.notice")}{" "}
        <ExternalLink
          href={href}
          className="-my-3 py-3 font-medium text-accent underline"
        >
          {t("machineTranslation.report")}
        </ExternalLink>
      </p>
    </div>
  );
}
