import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { localizedName } from "../i18n/localizedName";
import type { Route } from "../routing/route";
import type { BallotData } from "./useBallotData";

function useTitleParts(route: Route | null, data: BallotData): string[] {
  const { t } = useTranslation(["common", "about"]);
  if (route?.page === "about") return [t("about:title")];
  if (route?.page !== "ballot" || !data.municipality) return [];
  return [
    data.candidacy?.acronym,
    localizedName(data.municipality.name, route.language),
    t(`common:chamber.${route.chamber}`),
  ].filter((part): part is string => Boolean(part));
}

export function useDocumentTitle(route: Route | null, data: BallotData) {
  const { t } = useTranslation("common");
  const parts = useTitleParts(route, data);
  const title = [...parts, t("appTitle")].join(" · ");

  useEffect(() => {
    document.title = title;
  }, [title]);
}
