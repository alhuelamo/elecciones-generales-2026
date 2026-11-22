import { useTranslation } from "react-i18next";
import type { Chamber } from "../contract/types";
import { CHAMBER_SURFACE_CLASSES } from "../design/chamberSurface";
import { Envelope } from "../design/Envelope";

export function HowToVote(props: {
  chamber: Chamber;
  maxMarks: number | null;
}) {
  const { t } = useTranslation("constituency");
  return (
    <section
      aria-labelledby="how-to-vote-title"
      className={`${CHAMBER_SURFACE_CLASSES[props.chamber]} p-4`}
    >
      <h2
        id="how-to-vote-title"
        className="flex items-center gap-2 font-semibold"
      >
        <span
          aria-hidden="true"
          data-testid="envelope-swatch"
          data-chamber={props.chamber}
          className="inline-block size-6 shrink-0"
        >
          <Envelope chamber={props.chamber} className="size-full" />
        </span>
        {t("howToVote.title")}
      </h2>
      <p>{t(`howToVote.${props.chamber}`, { maxMarks: props.maxMarks })}</p>
    </section>
  );
}
