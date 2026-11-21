import { useTranslation } from "react-i18next";
import type { Chamber } from "../contract/types";

const ENVELOPE_CLASSES: Record<Chamber, string> = {
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
      className={`rounded border p-3 ${ENVELOPE_CLASSES[props.chamber]}`}
    >
      <h2 id="how-to-vote-title" className="font-semibold">
        {t("howToVote.title")}
      </h2>
      <p>{t(`howToVote.${props.chamber}`, { maxMarks: props.maxMarks })}</p>
    </section>
  );
}
