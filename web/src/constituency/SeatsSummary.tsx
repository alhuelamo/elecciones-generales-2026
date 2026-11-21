import { useTranslation } from "react-i18next";
import type { Chamber } from "../contract/types";

export function SeatsSummary(props: {
  chamber: Chamber;
  seats: number;
  maxMarks: number | null;
}) {
  const { t } = useTranslation("constituency");
  return (
    <p className="font-medium">
      {t(`seats.${props.chamber}`, {
        count: props.seats,
        maxMarks: props.maxMarks,
      })}
    </p>
  );
}
