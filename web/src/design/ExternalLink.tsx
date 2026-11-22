import type { ReactNode } from "react";

export function ExternalLink(props: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className={props.className}
    >
      {props.children}
    </a>
  );
}
