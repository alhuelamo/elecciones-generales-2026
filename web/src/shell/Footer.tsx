import { useTranslation } from "react-i18next";
import { SOURCE_URLS } from "../config";
import type { Language } from "../contract/types";
import { buildHash } from "../routing/route";

const SOURCE_LINKS = [
  ["boe", SOURCE_URLS.boeCandidacies],
  ["ine", SOURCE_URLS.ine],
  ["interior", SOURCE_URLS.interior],
] as const;

export function Footer(props: { language: Language }) {
  const { t } = useTranslation("shell");
  return (
    <footer>
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-col gap-2 border-t border-rule py-4 text-sm text-ink-muted">
          <p>{t("footer.neutrality")}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {SOURCE_LINKS.map(([key, url]) => (
              <li key={key}>
                <a
                  href={url}
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-accent underline underline-offset-2"
                >
                  {t(`footer.sources.${key}`)}
                </a>
              </li>
            ))}
            <li>
              <a
                href={buildHash({ page: "about", language: props.language })}
                className="inline-flex min-h-11 items-center text-accent underline underline-offset-2"
              >
                {t("about")}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
