import { getDocument } from "packages/utils/core/platform";

function queryMeta(attr: "name" | "property", key: string): HTMLMetaElement | null {
  const doc = getDocument();
  if (!doc?.head) return null;
  return doc.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
}

function ensureMeta(attr: "name" | "property", key: string): HTMLMetaElement | null {
  const doc = getDocument();
  if (!doc) return null;
  let el = queryMeta(attr, key);
  if (!el) {
    el = doc.createElement("meta");
    el.setAttribute(attr, key);
    doc.head.appendChild(el);
  }
  return el;
}

export function setDocumentTitle(title: string): void {
  const doc = getDocument();
  if (doc) {
    doc.title = title;
  }
}

export function removeHeadSelector(selector: string): void {
  getDocument()?.head.querySelector(selector)?.remove();
}

export function setMetaName(name: string, content: string): void {
  ensureMeta("name", name)?.setAttribute("content", content);
}

export function setMetaProperty(property: string, content: string): void {
  ensureMeta("property", property)?.setAttribute("content", content);
}

export function setCanonicalHref(href: string): void {
  const doc = getDocument();
  if (!doc?.head) return;
  let el = doc.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = doc.createElement("link");
    el.setAttribute("rel", "canonical");
    doc.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export type SocialMetaPatch = {
  title: string;
  description: string;
  /** Absolute URL for og:image / twitter:image */
  imageUrl: string;
  /** Absolute page URL for og:url */
  pageUrl: string;
};

/**
 * Updates Open Graph and Twitter Card tags (used by the app shell and page-level overrides).
 */
export function applySocialMetaTags(patch: SocialMetaPatch): void {
  setMetaProperty("og:title", patch.title);
  setMetaProperty("og:description", patch.description);
  setMetaProperty("og:image", patch.imageUrl);
  setMetaProperty("og:url", patch.pageUrl);
  setMetaName("twitter:card", "summary_large_image");
  setMetaName("twitter:title", patch.title);
  setMetaName("twitter:description", patch.description);
  setMetaName("twitter:image", patch.imageUrl);
}
