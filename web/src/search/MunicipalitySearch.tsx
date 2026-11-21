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
      <label className="block">
        <span className="sr-only">{t("label")}</span>
        <ComboboxInput
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          placeholder={t("placeholder")}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {query.trim() && (
        <ComboboxOptions
          static
          className="mt-1 rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
        >
          {results.length === 0 && (
            <p className="px-3 py-2 text-gray-600 dark:text-gray-300">
              {t("noResults")}
            </p>
          )}
          {results.map((municipality) => (
            <ComboboxOption
              key={municipality.code}
              value={municipality}
              className="cursor-pointer px-3 py-2 text-gray-900 data-[focus]:bg-gray-100 dark:text-gray-100 dark:data-[focus]:bg-gray-700"
            >
              <span>{municipality.name[language]}</span>{" "}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {provinceName(municipality)}
              </span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      )}
    </Combobox>
  );
}
