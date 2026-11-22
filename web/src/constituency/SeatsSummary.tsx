import { useTranslation } from "react-i18next";
import type { Chamber } from "../contract/types";
import { CHAMBER_SURFACE_CLASSES } from "../design/chamberSurface";

export function SeatsSummary(props: {
  chamber: Chamber;
  seats: number;
  maxMarks: number | null;
}) {
  const { t } = useTranslation("constituency");
  return (
    <p
      className={`${CHAMBER_SURFACE_CLASSES[props.chamber]} p-4 font-medium tabular-nums`}
    >
      {t(`seats.${props.chamber}`, {
        count: props.seats,
        maxMarks: props.maxMarks,
      })}
    </p>
  );
}
