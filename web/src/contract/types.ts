export type Language = "es" | "ca";
export type Chamber = "congreso" | "senado";
export type LocalizedText = Record<Language, string>;

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

export interface ConstituencyBallot {
  chamber: Chamber;
  constituencyId: string;
  seats: number;
  maxMarks: number | null;
  sources: SourceLink[];
  candidacies: Candidacy[];
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
