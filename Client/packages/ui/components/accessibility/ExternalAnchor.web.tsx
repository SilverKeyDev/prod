/* eslint-disable silverkey/no-primitive-components -- canonical external hyperlink primitive for web */
import type { ExternalAnchorProps } from "./ExternalAnchor.types";

const linkClasses = "text-brand-accent min-w-0 break-all underline";

export function ExternalAnchor({ href, children, className = "", label }: ExternalAnchorProps) {
  const isHttp = /^https?:\/\//i.test(href);
  const combined = [linkClasses, className].filter(Boolean).join(" ");

  return (
    <a
      href={href}
      className={combined}
      {...(isHttp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...(label ? { "aria-label": label } : {})}
    >
      {children}
    </a>
  );
}
