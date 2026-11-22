import { useTranslation } from "react-i18next";
import type { Language, PartyProfile } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { ExternalLink } from "../design/ExternalLink";

const WIKIPEDIA_FALLBACKS: Record<Language, readonly Language[]> = {
  es: ["es", "ca"],
  ca: ["ca", "es"],
  eu: ["eu", "es"],
  gl: ["gl", "es"],
};

export function PartyLinks(props: { profile: PartyProfile }) {
  const { t, i18n } = useTranslation("party");
  const { profile } = props;
  const language = i18n.language as Language;
  const wikipediaUrl = firstWikipediaUrl(profile, language);

  return (
    <>
      <PartyLink href={profile.website} label={t("links.website")} />
      <PartyLink href={profile.programmeUrl} label={t("links.programme")} />
      <PartyLink href={wikipediaUrl} label={t("links.wikipedia")} />
    </>
  );
}

function firstWikipediaUrl(profile: PartyProfile, language: Language) {
  const urls = WIKIPEDIA_FALLBACKS[language].map(
    (fallback) => profile.wikipedia[fallback],
  );
  return urls.find((url) => url !== null) ?? null;
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
