import { useTranslation } from "react-i18next";

export function DemoBanner() {
  const { t } = useTranslation("shell");
  return (
    <p
      role="status"
      className="border-b border-kraft-rule bg-kraft px-4 py-2 text-center text-sm text-ink"
    >
      {t("demoBanner")}
    </p>
  );
}
