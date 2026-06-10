import { useEffect } from "react";

import { DEFAULT_APP_TITLE, getDocumentTitle, getRouteSeoMeta } from "packages/navigation";
import {
  applySocialMetaTags,
  removeHeadSelector,
  setCanonicalHref,
  setDocumentTitle,
  setMetaName,
  setMetaProperty,
} from "packages/utils/seo/documentMeta";
import { setJsonLdScript } from "packages/utils/seo/jsonLd";
import { absoluteUrl, getSiteOrigin } from "packages/utils/seo/siteOrigin";

const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

/**
 * Organization + WebSite JSON-LD once per session (uses current origin in dev when env is unset).
 */
export function useGlobalOrganizationJsonLd(): void {
  useEffect(() => {
    const origin = getSiteOrigin();
    if (!origin) return;
    setJsonLdScript("seo-global-org", {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: DEFAULT_APP_TITLE,
          url: origin,
          logo: `${origin}/minilogo.png`,
        },
        {
          "@type": "WebSite",
          name: DEFAULT_APP_TITLE,
          url: origin,
        },
      ],
    });
  }, []);
}

/**
 * Keeps description, canonical, robots, and default Open Graph / Twitter tags in sync with the route.
 */
export function useShellSeo(pathname: string, search: string): void {
  useEffect(() => {
    const title = getDocumentTitle(pathname);
    setDocumentTitle(title);

    const { description, noindex } = getRouteSeoMeta(pathname);
    setMetaName("description", description);

    if (noindex) {
      setMetaName("robots", "noindex, nofollow");
    } else {
      removeHeadSelector('meta[name="robots"]');
    }

    const origin = getSiteOrigin();
    const pathWithSearch = `${pathname}${search || ""}`;
    const pageUrl = origin ? `${origin}${pathWithSearch}` : "";
    const canonicalPath = pathname || "/";
    const canonical = origin ? `${origin}${canonicalPath}` : "";

    if (canonical) {
      setCanonicalHref(canonical);
    } else {
      removeHeadSelector('link[rel="canonical"]');
    }

    const envImage = absoluteUrl(DEFAULT_OG_IMAGE_PATH);
    const imageUrl =
      envImage || (origin ? `${origin}${DEFAULT_OG_IMAGE_PATH}` : DEFAULT_OG_IMAGE_PATH);

    setMetaProperty("og:type", "website");
    setMetaProperty("og:site_name", DEFAULT_APP_TITLE);
    setMetaProperty("og:locale", "en_US");

    applySocialMetaTags({
      title,
      description,
      imageUrl,
      pageUrl: pageUrl || canonical || imageUrl,
    });
  }, [pathname, search]);
}
