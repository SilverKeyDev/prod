function queryMeta(attr: "name" | "property", key: string): HTMLMetaElement | null {
  return document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
}

function ensureMeta(attr: "name" | "property", key: string): HTMLMetaElement {
  let el = queryMeta(attr, key);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
}

export function setMetaName(name: string, content: string): void {
  ensureMeta("name", name).setAttribute("content", content);
}

export function setMetaProperty(property: string, content: string): void {
  ensureMeta("property", property).setAttribute("content", content);
}

export function setCanonicalHref(href: string): void {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
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
