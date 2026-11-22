import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AboutPage } from "./about/AboutPage";
import type { Candidacy, Chamber } from "./contract/types";
import { ConstituencyView } from "./constituency/ConstituencyView";
import { localizedName } from "./i18n/localizedName";
import { PartyDetail } from "./party/PartyDetail";
import { buildHash, type Route } from "./routing/route";
import { HomePage } from "./home/HomePage";
import { DemoBanner } from "./shell/DemoBanner";
import { ElectionBanner } from "./shell/ElectionBanner";
import { Footer } from "./shell/Footer";
import { Header } from "./shell/Header";
import { MachineTranslationNotice } from "./shell/MachineTranslationNotice";
import { useDocumentTitle } from "./shell/useDocumentTitle";
import { useBallotData, type BallotData } from "./shell/useBallotData";
import { replaceRoute, useLanguageRoute } from "./shell/useLanguageRoute";

type NoticeKey = "unknownMunicipality" | "unknownParty";
type Notice = { hash: string; key: NoticeKey };
type BallotRoute = Extract<Route, { page: "ballot" }>;

function useFallbackRedirects(
  route: Route | null,
  data: BallotData,
  showNotice: (notice: Notice) => void,
) {
  useEffect(() => {
    if (route?.page !== "ballot" || data.status !== "ready") return;
    const fallback = findFallback(route, data);
    if (fallback === null) return;
    showNotice({ hash: buildHash(fallback.route), key: fallback.key });
    replaceRoute(fallback.route);
  }, [route, data, showNotice]);
}

function findFallback(
  route: BallotRoute,
  data: BallotData,
): { route: Route; key: NoticeKey } | null {
  if (data.municipality === null) {
    return {
      route: { page: "home", language: route.language },
      key: "unknownMunicipality",
    };
  }
  if (route.partySlug && data.ballot && data.candidacy === null) {
    return { route: { ...route, partySlug: null }, key: "unknownParty" };
  }
  return null;
}

export function App() {
  const [route, navigate] = useLanguageRoute();
  const data = useBallotData(route);
  const [notice, setNotice] = useState<Notice | null>(null);
  useFallbackRedirects(route, data, setNotice);
  useDocumentTitle(route, data);

  if (route === null) return null;
  const activeNotice = notice?.hash === buildHash(route) ? notice.key : null;

  return (
    <div className="flex min-h-screen flex-col text-ink">
      <Header
        language={route.language}
        onLanguageChange={(language) => navigate({ ...route, language })}
      />
      <MachineTranslationNotice language={route.language} />
      <ElectionBanner />
      {data.index?.dataset === "fixture" && <DemoBanner />}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {activeNotice && <NoticeMessage noticeKey={activeNotice} />}
        <Page route={route} data={data} navigate={navigate} />
      </main>
      <Footer language={route.language} />
    </div>
  );
}

function NoticeMessage(props: { noticeKey: NoticeKey }) {
  const { t } = useTranslation("shell");
  return (
    <p
      role="alert"
      className="mb-4 rounded-frame border border-rule-strong bg-kraft px-3 py-2 text-ink"
    >
      {t(`notice.${props.noticeKey}`)}
    </p>
  );
}

function Page(props: {
  route: Route;
  data: BallotData;
  navigate: (route: Route) => void;
}) {
  const { route, data } = props;
  const { t } = useTranslation(["common", "shell"]);

  if (data.status === "error")
    return <p role="alert">{t("common:loadError")}</p>;
  if (data.status === "loading")
    return <p role="status">{t("common:loading")}</p>;
  if (route.page === "about") {
    return (
      <AboutPage
        generatedAt={data.index!.generatedAt}
        partyCatalog={data.partyCatalog}
      />
    );
  }
  if (route.page === "home" || data.municipality === null) {
    return (
      <HomePage
        language={route.language}
        data={data}
        navigate={props.navigate}
      />
    );
  }
  return <BallotPage route={route} data={data} navigate={props.navigate} />;
}

function BallotPage(props: {
  route: BallotRoute;
  data: BallotData;
  navigate: (route: Route) => void;
}) {
  const { route } = props;
  const { municipality, constituency, ballot, candidacy, partyCatalog } =
    props.data;
  if (!municipality || !constituency || !ballot) return null;

  const ballotHref = (chamber: Chamber, partySlug: string | null = null) =>
    buildHash({ ...route, chamber, partySlug });

  if (candidacy) {
    return (
      <PartyDetail
        candidacy={candidacy}
        chamber={ballot.chamber}
        maxMarks={ballot.maxMarks}
        profile={
          (candidacy.partyKey && partyCatalog?.parties[candidacy.partyKey]) ||
          null
        }
        constituencyName={localizedName(constituency.name, route.language)}
        backHref={ballotHref(route.chamber)}
      />
    );
  }
  return (
    <ConstituencyView
      index={props.data.index!}
      onMunicipalitySelect={(next) =>
        props.navigate({
          ...route,
          municipalityCode: next.code,
          partySlug: null,
        })
      }
      municipality={municipality}
      constituency={constituency}
      ballot={ballot}
      partyCatalog={partyCatalog}
      chamberHref={ballotHref}
      candidacyHref={(item: Candidacy) => ballotHref(route.chamber, item.slug)}
    />
  );
}

export default App;
