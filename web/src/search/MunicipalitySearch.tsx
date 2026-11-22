import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  Language,
  Municipality,
  MunicipalityIndex,
} from "../contract/types";
import { createMunicipalitySearch } from "./createMunicipalitySearch";

const INPUT_ID = "municipality-search";

interface MunicipalitySearchProps {
  index: MunicipalityIndex;
  onSelect: (municipality: Municipality) => void;
}

export function MunicipalitySearch({
  index,
  onSelect,
}: MunicipalitySearchProps) {
  const { t, i18n } = useTranslation("search");
  const [query, setQuery] = useState("");
  const search = useMemo(
    () => createMunicipalitySearch(index.municipalities),
    [index],
  );
  const results = useMemo(() => search(query), [search, query]);
  const language = i18n.language as Language;

  function provinceName(municipality: Municipality): string {
    const province = index.constituencies.congreso.find(
      ({ id }) => id === municipality.congreso,
    );
    return province?.name[language] ?? "";
  }

  return (
    <Combobox<Municipality | null>
      value={null}
      onChange={(municipality) => municipality && onSelect(municipality)}
      onClose={() => setQuery("")}
    >
      <label htmlFor={INPUT_ID} className="mb-2 block text-sm font-semibold">
        {t("label")}
      </label>
      <ComboboxInput
        id={INPUT_ID}
        className="h-14 w-full border-0 border-b-2 border-ink bg-transparent text-lg focus:border-accent focus:outline-none"
        placeholder={t("placeholder")}
        autoFocus
        onChange={(event) => setQuery(event.target.value)}
      />
      {query.trim() && (
        <ComboboxOptions
          static
          className="mt-1 border border-rule bg-paper-raised"
        >
          {results.length === 0 && (
            <p className="px-3 py-2 text-ink-muted">{t("noResults")}</p>
          )}
          {results.map((municipality) => (
            <ComboboxOption
              key={municipality.code}
              value={municipality}
              className="min-h-11 cursor-pointer px-3 py-2 data-focus:bg-kraft"
            >
              <span>{municipality.name[language]}</span>{" "}
              <span className="text-sm text-ink-muted">
                {provinceName(municipality)}
              </span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      )}
    </Combobox>
  );
}
