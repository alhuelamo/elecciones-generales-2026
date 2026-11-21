import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LINK_CHIP_CLASSES } from "./linkChip";
import type { Language, PartyProfile } from "../contract/types";

export function PartyFacts(props: { profile: PartyProfile }) {
  const { t, i18n } = useTranslation("party");
  const { profile } = props;
  const language = i18n.language as Language;
  const otherLanguage: Language = language === "es" ? "ca" : "es";
  const wikipediaUrl =
    profile.wikipedia[language] ?? profile.wikipedia[otherLanguage];

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t("facts.title")}</h2>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {profile.leader && (
          <Fact label={t("facts.leader")}>{profile.leader}</Fact>
        )}
        {profile.founded !== null && (
          <Fact label={t("facts.founded")}>{profile.founded}</Fact>
        )}
        {profile.seats2023 && (
          <Fact label={t("facts.seats2023")}>
            {t("facts.seats2023Value", profile.seats2023)}
          </Fact>
        )}
      </dl>
      <ul className="mt-3 flex flex-wrap gap-2">
        <ExternalLink href={profile.website} label={t("links.website")} />
        <ExternalLink
          href={profile.programmeUrl}
          label={t("links.programme")}
        />
        <ExternalLink href={wikipediaUrl} label={t("links.wikipedia")} />
      </ul>
    </section>
  );
}

function Fact(props: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="opacity-70">{props.label}</dt>
      <dd>{props.children}</dd>
    </>
  );
}

function ExternalLink(props: { href: string | null; label: string }) {
  if (!props.href) return null;
  return (
    <li>
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CHIP_CLASSES}
      >
        {props.label}
      </a>
    </li>
  );
}
