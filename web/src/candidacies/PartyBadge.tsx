import { useState } from "react";
import type { PartyLogo } from "../contract/types";
import { badgeColor } from "./badgeColor";

const SIZE_CLASSES = {
  small: "h-8 min-w-8 max-w-20 px-1.5 text-[10px] leading-8",
  large: "h-20 min-w-20 max-w-48 px-3 text-lg leading-[5rem]",
} as const;

const LOGO_SIZE_CLASSES = {
  small: "h-8 w-8",
  large: "h-20 w-20",
} as const;

const LONG_ACRONYM_LENGTH = 6;
const MAX_INITIALS = 4;

export function PartyBadge(props: {
  acronym: string;
  denomination?: string;
  logo: PartyLogo | null;
  size: "small" | "large";
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  if (props.logo && !logoFailed) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}${props.logo.path}`}
        alt={props.acronym}
        onError={() => setLogoFailed(true)}
        className={`${LOGO_SIZE_CLASSES[props.size]} shrink-0 rounded bg-white object-contain p-0.5 ring-1 ring-black/10`}
      />
    );
  }
  const label = props.acronym || initialsOf(props.denomination ?? "");
  const fullName = props.acronym || props.denomination || label;
  const { background, foreground } = badgeColor(label);
  const scaling = label.length > LONG_ACRONYM_LENGTH ? "tracking-tighter" : "";
  return (
    <span
      title={fullName}
      style={{ backgroundColor: background, color: foreground }}
      className={`${SIZE_CLASSES[props.size]} ${scaling} inline-block shrink-0 truncate rounded-lg text-center font-bold`}
    >
      {label}
    </span>
  );
}

function initialsOf(denomination: string): string {
  return denomination
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, MAX_INITIALS)
    .map((word) => word[0].toUpperCase())
    .join("");
}
