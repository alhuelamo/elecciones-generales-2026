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
      <div className="flex items-center gap-3 rounded-frame border border-rule-strong bg-paper-raised px-4 shadow-sm transition-shadow duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40">
        <SearchIcon />
        <ComboboxInput
          aria-label={t("label")}
          className="h-14 min-w-0 flex-1 bg-transparent text-lg placeholder:text-ink-muted focus:outline-none focus-visible:outline-none"
          placeholder={t("placeholder")}
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {query.trim() && (
        <ComboboxOptions
          static
          className="mt-2 overflow-hidden rounded-frame border border-rule bg-paper-raised shadow-md"
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

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0 text-ink-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
