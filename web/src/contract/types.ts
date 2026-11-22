export type { Language } from "../i18n/languages";
export type Chamber = "congreso" | "senado";
export type LocalizedText = Record<"es" | "ca", string> &
  Partial<Record<"eu" | "gl", string>>;

export interface ConstituencySummary {
  id: string;
  name: LocalizedText;
  seats: number;
  maxMarks: number | null;
}

export interface Municipality {
  code: string;
  name: LocalizedText;
  aliases: string[];
  congreso: string;
  senado: string;
}

export interface MunicipalityIndex {
  dataset: "fixture" | "boe-2026";
  generatedAt: string;
  constituencies: Record<Chamber, ConstituencySummary[]>;
  municipalities: Municipality[];
}

export interface Candidate {
  position: number;
  name: string;
  substituteNames: string[];
}

export interface Results2023 {
  votes: number;
  percentage: number | null;
  seats: number;
  asAcronyms: string[];
}

export interface Candidacy {
  slug: string;
  boeOrder: number;
  denomination: string;
  acronym: string;
  partyKey: string | null;
  isCoalition: boolean;
  candidates: Candidate[];
  substitutes: Candidate[];
  results2023: Results2023 | null;
}

export interface SourceLink {
  label: string;
  url: string;
}

export interface PartyResult2023 {
  acronym: string;
  name: string;
  votes: number | null;
  percentage: number | null;
  seats: number;
  color: string | null;
}

export interface ConstituencyResults2023 {
  electorate: number;
  totalVotes: number;
  turnoutPercentage: number;
  validVotes: number;
  blankVotes: number;
  blankPercentage: number | null;
  combinedDistrictName: string | null;
  parties: PartyResult2023[];
}

export interface ConstituencyBallot {
  chamber: Chamber;
  constituencyId: string;
  seats: number;
  maxMarks: number | null;
  sources: SourceLink[];
  candidacies: Candidacy[];
  constituencyResults2023: ConstituencyResults2023 | null;
}

export interface PartyLogo {
  path: string;
  sourceUrl: string;
  license: string;
  author: string;
}

export interface PartyProfile {
  key: string;
  name: string;
  logo: PartyLogo | null;
  website: string | null;
  programmeUrl: string | null;
  leader: string | null;
  founded: number | null;
  seats2023: { congreso: number; senado: number } | null;
  wikipedia: { es: string | null; ca: string | null };
}

export interface PartyCatalog {
  parties: Record<string, PartyProfile>;
}
