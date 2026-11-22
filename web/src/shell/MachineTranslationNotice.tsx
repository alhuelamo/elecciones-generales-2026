import { useTranslation } from "react-i18next";
import { ISSUES_URL } from "../config";
import { ExternalLink } from "../design/ExternalLink";
import type { Language } from "../i18n/languages";

const MACHINE_TRANSLATED_LANGUAGES: ReadonlySet<Language> = new Set([
  "eu",
  "gl",
]);

export function translationIssueUrl(issue: {
  title: string;
  body: string;
}): string {
  return `${ISSUES_URL}?${new URLSearchParams(issue)}`;
}

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
      <p className="text-center text-sm text-ink-muted">
        {t("machineTranslation.notice")}{" "}
        <ExternalLink
          href={href}
          className="inline-flex min-h-11 items-center font-medium text-accent underline"
        >
          {t("machineTranslation.report")}
        </ExternalLink>
      </p>
    </div>
  );
}
