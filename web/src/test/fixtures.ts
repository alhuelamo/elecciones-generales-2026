import type {
  Candidacy,
  Candidate,
  ConstituencyBallot,
  ConstituencySummary,
  MunicipalityIndex,
  PartyCatalog,
} from "../contract/types";

const FIXTURE_SOURCE = {
  label: "BOE-A-2026-23103",
  url: "https://www.boe.es/diario_boe/xml.php?id=BOE-A-2026-23103",
};

function summary(
  id: string,
  es: string,
  ca: string,
  seats: number,
  maxMarks: number | null,
): ConstituencySummary {
  return { id, name: { es, ca }, seats, maxMarks };
}

function senateSummary(
  id: string,
  es: string,
  ca: string,
  seats: number,
): ConstituencySummary {
  return summary(id, es, ca, seats, Math.max(seats - 1, 1));
}

function congressSummary(
  id: string,
  es: string,
  ca: string,
  seats: number,
): ConstituencySummary {
  return summary(id, es, ca, seats, null);
}

export const fixtureIndex: MunicipalityIndex = {
  dataset: "fixture",
  generatedAt: "2026-11-20T10:00:00Z",
  constituencies: {
    congreso: [
      congressSummary("03", "Alicante", "Alacant", 12),
      congressSummary("07", "Illes Balears", "Illes Balears", 8),
      congressSummary("08", "Barcelona", "Barcelona", 32),
      congressSummary("15", "A Coruña", "A Corunya", 8),
      congressSummary("17", "Girona", "Girona", 6),
      congressSummary("20", "Gipuzkoa", "Gipuzkoa", 6),
      congressSummary("28", "Madrid", "Madrid", 37),
      congressSummary("33", "Asturias", "Astúries", 7),
      congressSummary("51", "Ceuta", "Ceuta", 1),
    ],
    senado: [
      senateSummary("03", "Alicante", "Alacant", 4),
      senateSummary("07-formentera", "Formentera", "Formentera", 1),
      senateSummary("07-mallorca", "Mallorca", "Mallorca", 3),
      senateSummary("08", "Barcelona", "Barcelona", 4),
      senateSummary("15", "A Coruña", "A Corunya", 4),
      senateSummary("17", "Girona", "Girona", 4),
      senateSummary("20", "Gipuzkoa", "Gipuzkoa", 4),
      senateSummary("28", "Madrid", "Madrid", 4),
      senateSummary("33", "Asturias", "Astúries", 4),
      senateSummary("51", "Ceuta", "Ceuta", 2),
    ],
  },
  municipalities: [
    {
      code: "08019",
      name: { es: "Barcelona", ca: "Barcelona" },
      aliases: [],
      congreso: "08",
      senado: "08",
    },
    {
      code: "08101",
      name: {
        es: "Hospitalet de Llobregat",
        ca: "L'Hospitalet de Llobregat",
      },
      aliases: [
        "Hospitalet de Llobregat, L'",
        "Hospitalet de Llobregat",
        "L'Hospitalet de Llobregat",
      ],
      congreso: "08",
      senado: "08",
    },
    {
      code: "07040",
      name: { es: "Palma de Mallorca", ca: "Palma" },
      aliases: ["Palma de Mallorca"],
      congreso: "07",
      senado: "07-mallorca",
    },
    {
      code: "07024",
      name: { es: "Formentera", ca: "Formentera" },
      aliases: [],
      congreso: "07",
      senado: "07-formentera",
    },
    {
      code: "15030",
      name: { es: "A Coruña", ca: "A Coruña" },
      aliases: ["Coruña, A", "A Coruña"],
      congreso: "15",
      senado: "15",
    },
    {
      code: "03014",
      name: { es: "Alicante", ca: "Alacant" },
      aliases: ["Alicante/Alacant", "Alicante", "Alacant"],
      congreso: "03",
      senado: "03",
    },
    {
      code: "20069",
      name: { es: "San Sebastián", ca: "Sant Sebastià" },
      aliases: [
        "Donostia/San Sebastián",
        "Donostia",
        "San Sebastián",
        "Sant Sebastià",
      ],
      congreso: "20",
      senado: "20",
    },
    {
      code: "28079",
      name: { es: "Madrid", ca: "Madrid" },
      aliases: [],
      congreso: "28",
      senado: "28",
    },
    {
      code: "28127",
      name: { es: "Las Rozas de Madrid", ca: "Las Rozas de Madrid" },
      aliases: [],
      congreso: "28",
      senado: "28",
    },
    {
      code: "33037",
      name: { es: "Mieres", ca: "Mieres" },
      aliases: [],
      congreso: "33",
      senado: "33",
    },
    {
      code: "17105",
      name: { es: "Mieres", ca: "Mieres" },
      aliases: [],
      congreso: "17",
      senado: "17",
    },
    {
      code: "51001",
      name: { es: "Ceuta", ca: "Ceuta" },
      aliases: [],
      congreso: "51",
      senado: "51",
    },
  ],
};

function titulares(
  prefix: string,
  count: number,
  withSubstituteNames: boolean,
): Candidate[] {
  return Array.from({ length: count }, (_, index) => ({
    position: index + 1,
    name: `Candidata Ejemplo ${prefix}${index + 1}`,
    substituteNames: withSubstituteNames
      ? [
          `Suplente Ejemplo ${prefix}${index + 1}A`,
          `Suplente Ejemplo ${prefix}${index + 1}B`,
        ]
      : [],
  }));
}

function substitutes(prefix: string): Candidate[] {
  return Array.from({ length: 2 }, (_, index) => ({
    position: index + 1,
    name: `Suplente Ejemplo ${prefix}${index + 1}`,
    substituteNames: [],
  }));
}

export function buildFixtureBallot(
  chamber: ConstituencyBallot["chamber"],
  constituencyId: string,
  candidacies: Candidacy[],
): ConstituencyBallot {
  const constituencies = fixtureIndex.constituencies[chamber];
  const { seats, maxMarks } = constituencies.find(
    ({ id }) => id === constituencyId,
  )!;
  return {
    chamber,
    constituencyId,
    seats,
    maxMarks,
    sources: [FIXTURE_SOURCE],
    candidacies,
  };
}

export function buildFixtureCongresoCandidacies(
  candidateCount: number,
): Candidacy[] {
  return [
    {
      slug: "pea",
      boeOrder: 1,
      denomination: "PARTIDO EJEMPLO A",
      acronym: "PEA",
      partyKey: "pea",
      isCoalition: false,
      candidates: titulares("A", candidateCount, false),
      substitutes: substitutes("A"),
      results2023: {
        votes: 1000000,
        percentage: 34.12,
        seats: 12,
        asAcronyms: ["PEA"],
      },
    },
    {
      slug: "peb",
      boeOrder: 2,
      denomination: "PARTIDO EJEMPLO B",
      acronym: "PEB",
      partyKey: null,
      isCoalition: false,
      candidates: titulares("B", candidateCount, false),
      substitutes: substitutes("B"),
      results2023: null,
    },
    {
      slug: "coalicion-ejemplo",
      boeOrder: 3,
      denomination: "COALICION EJEMPLO C-D",
      acronym: "CEC-D",
      partyKey: null,
      isCoalition: true,
      candidates: titulares("C", candidateCount, false),
      substitutes: substitutes("C"),
      results2023: {
        votes: 250000,
        percentage: 8.5,
        seats: 2,
        asAcronyms: ["PEC", "PED"],
      },
    },
  ];
}

export function buildFixtureSenadoCandidacies(
  candidateCount: number,
): Candidacy[] {
  return [
    {
      slug: "pea",
      boeOrder: 1,
      denomination: "PARTIDO EJEMPLO A",
      acronym: "PEA",
      partyKey: "pea",
      isCoalition: false,
      candidates: titulares("A", candidateCount, true),
      substitutes: [],
      results2023: {
        votes: 120000,
        percentage: null,
        seats: 2,
        asAcronyms: ["PEA"],
      },
    },
    {
      slug: "peb",
      boeOrder: 2,
      denomination: "PARTIDO EJEMPLO B",
      acronym: "PEB",
      partyKey: null,
      isCoalition: false,
      candidates: titulares("B", candidateCount, true),
      substitutes: [],
      results2023: null,
    },
  ];
}

export const fixtureCongresoBarcelona: ConstituencyBallot = buildFixtureBallot(
  "congreso",
  "08",
  buildFixtureCongresoCandidacies(32),
);

export const fixtureSenadoMallorca: ConstituencyBallot = buildFixtureBallot(
  "senado",
  "07-mallorca",
  buildFixtureSenadoCandidacies(3),
);

export const fixtureCatalog: PartyCatalog = {
  parties: {
    pea: {
      key: "pea",
      name: "Partido Ejemplo A",
      logo: {
        path: "logos/pea.svg",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Ejemplo.svg",
        license: "CC BY-SA 4.0",
        author: "Autora Ejemplo",
      },
      website: "https://example.org/pea",
      programmeUrl: "https://example.org/pea/programa",
      leader: "Candidata Ejemplo A1",
      founded: 1979,
      seats2023: { congreso: 12, senado: 2 },
      wikipedia: {
        es: "https://es.wikipedia.org/wiki/Partido_Ejemplo_A",
        ca: "https://ca.wikipedia.org/wiki/Partit_Exemple_A",
      },
    },
    peb: {
      key: "peb",
      name: "Partido Ejemplo B",
      logo: null,
      website: null,
      programmeUrl: null,
      leader: null,
      founded: null,
      seats2023: null,
      wikipedia: { es: null, ca: null },
    },
  },
};
