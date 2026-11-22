import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import type { Municipality, MunicipalityIndex } from "../contract/types";
import { BUTTON_CLASSES } from "../design/button";
import { MunicipalitySearch } from "../search/MunicipalitySearch";

export function MunicipalitySwitcher(props: {
  children: ReactNode;
  index: MunicipalityIndex;
  onSelect: (municipality: Municipality) => void;
}) {
  const { t } = useTranslation("constituency");
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape") close();
  }

  function select(municipality: Municipality) {
    setOpen(false);
    props.onSelect(municipality);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        {props.children}
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close() : setOpen(true))}
          className={`${BUTTON_CLASSES} shrink-0 aria-expanded:border-accent`}
        >
          <SwapIcon />
          {t("changeMunicipality")}
        </button>
      </div>
      {open && (
        <div id={panelId} onKeyDown={closeOnEscape}>
          <MunicipalitySearch index={props.index} onSelect={select} />
        </div>
      )}
    </div>
  );
}

function SwapIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h14" />
      <path d="m17 20 4-4-4-4" />
      <path d="M21 16H7" />
    </svg>
  );
}
