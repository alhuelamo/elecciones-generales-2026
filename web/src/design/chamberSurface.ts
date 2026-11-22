import type { Chamber } from "../contract/types";

export const CHAMBER_SURFACE_CLASSES: Record<Chamber, string> = {
  congreso: "bg-paper-raised border border-rule rounded-sm",
  senado: "bg-kraft border border-kraft-rule rounded-sm",
};
