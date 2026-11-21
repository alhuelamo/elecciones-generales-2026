import { useTranslation } from "react-i18next";

export function DemoBanner() {
  const { t } = useTranslation("shell");
  return (
    <p
      role="status"
      className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100"
    >
      {t("demoBanner")}
    </p>
  );
}
