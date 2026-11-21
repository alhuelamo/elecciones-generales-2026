import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AboutPage } from "./about/AboutPage";
import type { Candidacy, Chamber, Language } from "./contract/types";
import { ConstituencyView } from "./constituency/ConstituencyView";
import { PartyDetail } from "./party/PartyDetail";
import { buildHash, type Route } from "./routing/route";
import { MunicipalitySearch } from "./search/MunicipalitySearch";
import { DemoBanner } from "./shell/DemoBanner";
import { Footer } from "./shell/Footer";
import { Header } from "./shell/Header";
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

  if (route === null) return null;
  const activeNotice = notice?.hash === buildHash(route) ? notice.key : null;

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Header
        language={route.language}
        onLanguageChange={(language) => navigate({ ...route, language })}
      />
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
      className="mb-4 rounded border border-amber-400 bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
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
  return <BallotPage route={route} data={data} />;
}

function HomePage(props: {
  language: Language;
  data: BallotData;
  navigate: (route: Route) => void;
}) {
  const { t } = useTranslation("shell");
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("home.title")}</h1>
      <p>{t("home.intro")}</p>
      <MunicipalitySearch
        index={props.data.index!}
        onSelect={(municipality) =>
          props.navigate({
            page: "ballot",
            language: props.language,
            municipalityCode: municipality.code,
            chamber: "congreso",
            partySlug: null,
          })
        }
      />
    </section>
  );
}

function BallotPage(props: { route: BallotRoute; data: BallotData }) {
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
        backHref={ballotHref(route.chamber)}
      />
    );
  }
  return (
    <ConstituencyView
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
