import { useTranslation } from "react-i18next";
import { numberFormatLocale, type Language } from "./languages";

export function useNumberFormat(
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const { i18n } = useTranslation();
  return new Intl.NumberFormat(
    numberFormatLocale(i18n.language as Language),
    options,
  );
}
