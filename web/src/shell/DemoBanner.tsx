import { useTranslation } from "react-i18next";

export function DemoBanner() {
  const { t } = useTranslation("shell");
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <p
        role="status"
        className="rounded-frame border border-kraft-rule bg-kraft px-4 py-2 text-center text-sm text-ink"
      >
        {t("demoBanner")}
      </p>
    </div>
  );
}
