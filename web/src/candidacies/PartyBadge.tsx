import type { PartyLogo } from "../contract/types";
import { badgeColor } from "./badgeColor";

const SIZE_CLASSES = {
  small: "h-8 w-8 text-[10px]",
  large: "h-16 w-16 text-sm",
} as const;

export function PartyBadge(props: {
  acronym: string;
  logo: PartyLogo | null;
  size: "small" | "large";
}) {
  const sizeClasses = SIZE_CLASSES[props.size];
  if (props.logo) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}${props.logo.path}`}
        alt={props.acronym}
        className={`${sizeClasses} shrink-0 object-contain`}
      />
    );
  }
  const { background, foreground } = badgeColor(props.acronym);
  return (
    <span
      title={props.acronym}
      style={{ backgroundColor: background, color: foreground }}
      className={`${sizeClasses} flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold`}
    >
      {props.acronym}
    </span>
  );
}
