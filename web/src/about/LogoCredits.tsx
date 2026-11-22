import { useTranslation } from "react-i18next";
import type { PartyCatalog, PartyProfile } from "../contract/types";

type ProfileWithLogo = PartyProfile & {
  logo: NonNullable<PartyProfile["logo"]>;
};

function hasLogo(profile: PartyProfile): profile is ProfileWithLogo {
  return profile.logo !== null;
}

export function LogoCredits(props: { partyCatalog: PartyCatalog | null }) {
  const { t } = useTranslation("about");
  const profiles = Object.values(props.partyCatalog?.parties ?? {}).filter(
    hasLogo,
  );
  if (profiles.length === 0) {
    return null;
  }
  return (
    <section className="border-t border-rule pt-4">
      <h2 className="font-display text-xl">{t("logos.title")}</h2>
      <p>{t("logos.intro")}</p>
      <ul aria-label={t("logos.listLabel")} className="divide-y divide-rule">
        {profiles.map((profile) => (
          <li key={profile.key}>
            {profile.name} · {profile.logo.license} ·{" "}
            {t("logos.by", { author: profile.logo.author })} ·{" "}
            <a
              href={profile.logo.sourceUrl}
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              {t("logos.source")}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
