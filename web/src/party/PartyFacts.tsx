import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PartyProfile } from "../contract/types";

export interface LocalHead {
  constituencyName: string;
  name: string;
}

export function PartyFacts(props: {
  profile: PartyProfile | null;
  localHead: LocalHead | null;
}) {
  const { t } = useTranslation("party");
  const { profile, localHead } = props;
  if (!profile && !localHead) return null;

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">{t("facts.title")}</h2>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {profile?.leader && (
          <Fact label={t("facts.partyLeader")}>{profile.leader}</Fact>
        )}
        {localHead && (
          <Fact
            label={t("facts.localHead", {
              constituency: localHead.constituencyName,
            })}
          >
            {localHead.name}
          </Fact>
        )}
        {profile && <ProfileFacts profile={profile} />}
      </dl>
    </section>
  );
}

function ProfileFacts(props: { profile: PartyProfile }) {
  const { t } = useTranslation("party");
  const { profile } = props;
  return (
    <>
      {profile.founded !== null && (
        <Fact label={t("facts.founded")}>{profile.founded}</Fact>
      )}
      {profile.seats2023 && (
        <Fact label={t("facts.seats2023")}>
          {t("facts.seats2023Value", profile.seats2023)}
        </Fact>
      )}
    </>
  );
}

function Fact(props: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-ink-muted">{props.label}</dt>
      <dd>{props.children}</dd>
    </>
  );
}
