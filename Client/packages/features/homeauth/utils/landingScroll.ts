import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { getDocument, getWindow } from "packages/utils/core/platform";

/** Parse scroll-margin-top from landing section class (matches `landingChrome.ts`). */
function getLandingScrollOffsetPx(): number {
  const doc = getDocument();
  if (!doc) {
    return 64;
  }

  const probe = doc.createElement("div");
  probe.className = LANDING_NAV_SCROLL_MARGIN_CLASS;
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  doc.body.appendChild(probe);
  const marginTop = getWindow()?.getComputedStyle(probe).scrollMarginTop ?? "64px";
  doc.body.removeChild(probe);

  const parsed = Number.parseFloat(marginTop);
  return Number.isFinite(parsed) ? parsed : 64;
}

export function scrollToLandingSection(sectionId: string): void {
  const doc = getDocument();
  const win = getWindow();
  const element = doc?.getElementById(sectionId);
  if (!element || !win) {
    return;
  }

  const offset = getLandingScrollOffsetPx();
  const top = element.getBoundingClientRect().top + win.scrollY - offset;
  win.scrollTo({ top: Math.max(0, top), behavior: "smooth" });

  if (win.location.pathname === "/" || win.location.pathname === "") {
    win.history.replaceState(null, "", `/#${sectionId}`);
  }
}
