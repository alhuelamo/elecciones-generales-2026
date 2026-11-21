export const REPO_URL: string =
  import.meta.env.VITE_REPO_URL ??
  "https://github.com/alhuelamo/elecciones-generales-2026";

export const PARTIES_EDIT_URL = `${REPO_URL}/edit/main/pipeline/data/parties.yaml`;

export const ISSUES_URL = `${REPO_URL}/issues/new`;

export const STORAGE_KEYS = {
  language: "eg26.lang",
  theme: "eg26.theme",
} as const;

export const SOURCE_URLS = {
  boeCandidacies: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-23103",
  boeConvocation: "https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20742",
  ine: "https://www.ine.es/daco/daco42/codmun/26codmun.xlsx",
  interior: "https://infoelectoral.interior.gob.es",
  pollingStationLookup:
    "https://sede.ine.gob.es/tramite/consulta_mesas_locales/",
  codeForSpain:
    "https://github.com/codeforspain/ds-organizacion-administrativa",
  commons: "https://commons.wikimedia.org",
  partiesYaml: `${REPO_URL}/blob/main/pipeline/data/parties.yaml`,
} as const;
