import { useTranslation } from "react-i18next";
import type { Chamber } from "../contract/types";

const SWATCH_CLASSES: Record<Chamber, string> = {
  congreso: "border-gray-300 bg-white text-gray-900",
  senado: "border-amber-700 bg-amber-100 text-amber-950",
};

export function HowToVote(props: {
  chamber: Chamber;
  maxMarks: number | null;
}) {
  const { t } = useTranslation("constituency");
  return (
    <section
      aria-labelledby="how-to-vote-title"
      className="rounded border border-gray-300 p-3 dark:border-gray-600"
    >
      <h2
        id="how-to-vote-title"
        className="flex items-center gap-2 font-semibold"
      >
        <span
          aria-hidden="true"
          data-testid="envelope-swatch"
          data-chamber={props.chamber}
          className={`inline-block h-4 w-6 shrink-0 rounded-sm border ${SWATCH_CLASSES[props.chamber]}`}
        />
        {t("howToVote.title")}
      </h2>
      <p>{t(`howToVote.${props.chamber}`, { maxMarks: props.maxMarks })}</p>
    </section>
  );
}
