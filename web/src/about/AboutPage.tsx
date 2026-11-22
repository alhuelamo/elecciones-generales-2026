import { useTranslation } from "react-i18next";
import { ISSUES_URL, SOURCE_URLS } from "../config";
import type { PartyCatalog } from "../contract/types";
import { LogoCredits } from "./LogoCredits";

interface AboutPageProps {
  generatedAt: string;
  partyCatalog: PartyCatalog | null;
}

const LINKED_SOURCES = [
  ["boeCandidacies", SOURCE_URLS.boeCandidacies],
  ["boeConvocation", SOURCE_URLS.boeConvocation],
  ["ine", SOURCE_URLS.ine],
  ["interior", SOURCE_URLS.interior],
] as const;

function formatGeneratedAt(generatedAt: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(generatedAt));
}

export function AboutPage({ generatedAt, partyCatalog }: AboutPageProps) {
  const { t, i18n } = useTranslation("about");
  return (
    <article>
      <h1 className="font-display text-3xl">{t("title")}</h1>
      <p role="note">{t("disclaimer")}</p>
      <section className="border-t border-rule pt-4">
        <h2 className="font-display text-xl">{t("sources.title")}</h2>
        <ul>
          {LINKED_SOURCES.map(([key, url]) => (
            <li key={key}>
              <a
                href={url}
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                {t(`sources.${key}`)}
              </a>
            </li>
          ))}
          <li>
            <a
              href={SOURCE_URLS.codeForSpain}
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              {t("sources.islands")}
            </a>
          </li>
          <li>
            <a
              href={SOURCE_URLS.commons}
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Wikimedia Commons
            </a>
          </li>
          <li>
            <a
              href={SOURCE_URLS.partiesYaml}
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              {t("sources.parties")}
            </a>{" "}
            {t("sources.partiesHint")}
          </li>
        </ul>
      </section>
      <LogoCredits partyCatalog={partyCatalog} />
      <p>
        {t("updated.label")}:{" "}
        <time dateTime={generatedAt} className="tabular-nums">
          {formatGeneratedAt(generatedAt, i18n.language)}
        </time>
      </p>
      <section className="border-t border-rule pt-4">
        <h2 className="font-display text-xl">{t("report.title")}</h2>
        <a
          href={ISSUES_URL}
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          {t("report.link")}
        </a>
      </section>
      <p>{t("license")}</p>
    </article>
  );
}
