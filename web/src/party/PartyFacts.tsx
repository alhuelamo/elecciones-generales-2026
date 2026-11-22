import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { PartyProfile } from "../contract/types";

export function PartyFacts(props: { profile: PartyProfile }) {
  const { t } = useTranslation("party");
  const { profile } = props;

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
    </section>
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
