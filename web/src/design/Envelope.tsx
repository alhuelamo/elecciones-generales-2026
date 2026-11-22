import type { Chamber } from "../contract/types";

const FILL_CLASSES: Record<Chamber, string> = {
  congreso: "fill-paper-raised",
  senado: "fill-kraft",
};

export function Envelope({
  chamber,
  className,
}: {
  chamber: Chamber;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      data-chamber={chamber}
      viewBox="0 0 24 24"
      className={className}
    >
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="1"
        className={`${FILL_CLASSES[chamber]} stroke-rule-strong`}
        strokeWidth="1.5"
      />
      <path
        d="M2 6l10 7 10-7"
        fill="none"
        className="stroke-rule-strong"
        strokeWidth="1.5"
      />
    </svg>
  );
}
