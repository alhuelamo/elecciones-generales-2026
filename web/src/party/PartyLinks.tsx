import { useTranslation } from "react-i18next";
import type { Language, PartyProfile } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";

export function PartyLinks(props: { profile: PartyProfile }) {
  const { t, i18n } = useTranslation("party");
  const { profile } = props;
  const language = i18n.language as Language;
  const otherLanguage: Language = language === "es" ? "ca" : "es";
  const wikipediaUrl =
    profile.wikipedia[language] ?? profile.wikipedia[otherLanguage];

  return (
    <>
      <ExternalLink href={profile.website} label={t("links.website")} />
      <ExternalLink href={profile.programmeUrl} label={t("links.programme")} />
      <ExternalLink href={wikipediaUrl} label={t("links.wikipedia")} />
    </>
  );
}

function ExternalLink(props: { href: string | null; label: string }) {
  if (!props.href) return null;
  return (
    <li className="min-w-0 flex-1 sm:flex-none">
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${BUTTON_CLASSES} w-full`}
      >
        {props.label}
      </a>
    </li>
  );
}
