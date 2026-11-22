import { useTranslation } from "react-i18next";
import type { Language, PartyProfile } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { ExternalLink } from "../design/ExternalLink";

export function PartyLinks(props: { profile: PartyProfile }) {
  const { t, i18n } = useTranslation("party");
  const { profile } = props;
  const language = i18n.language as Language;
  const otherLanguage: Language = language === "es" ? "ca" : "es";
  const wikipediaUrl =
    profile.wikipedia[language] ?? profile.wikipedia[otherLanguage];

  return (
    <>
      <PartyLink href={profile.website} label={t("links.website")} />
      <PartyLink href={profile.programmeUrl} label={t("links.programme")} />
      <PartyLink href={wikipediaUrl} label={t("links.wikipedia")} />
    </>
  );
}

function PartyLink(props: { href: string | null; label: string }) {
  if (!props.href) return null;
  return (
    <li className="min-w-0 flex-1 sm:flex-none">
      <ExternalLink href={props.href} className={`${BUTTON_CLASSES} w-full`}>
        {props.label}
      </ExternalLink>
    </li>
  );
}
