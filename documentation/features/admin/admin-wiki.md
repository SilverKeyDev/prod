# Admin Wiki

> **Status:** Shipped  
> **Last verified:** 2026-07-12  
> **Code:** `Client/packages/features/admin/components/sections/wiki/`, `Client/apps/web/vite.plugin.wiki.js`  
> **Route:** `/admin/wiki` (and nested paths)

In-app documentation browser for platform admins. Renders the repo `documentation/` tree the same way a Meta-style internal wiki would: left nav folder tree, article view, breadcrumbs, optional TOC.

## As-built surface

| Piece | Location |
|-------|----------|
| Thin app outlet | `Client/apps/web/pages/workspace/admin/AdminWikiOutlet.tsx` |
| Section shell | `AdminWikiSection.web.tsx` |
| Tree nav | `WikiTreeNav.web.tsx` |
| Article | `WikiArticle.web.tsx` |
| Breadcrumbs / TOC | `WikiBreadcrumbs.web.tsx`, `WikiToc.web.tsx` |
| Path hook | `Client/packages/features/admin/hooks/useWikiPath.ts` |
| Tree helpers | `Client/packages/features/admin/utils/wiki/wikiTree.ts` |
| Virtual module types | `Client/packages/features/admin/types/virtual-silverkey-wiki.d.ts` |
| Vite plugin | `Client/apps/web/vite.plugin.wiki.js` |

Available to **platform admins** (not superadmin-only). Nav entry is in admin nav config.

## Data flow

```text
documentation/**/*.md
        │
        ▼
silverkeyWikiPlugin (dev + build)
        │
        ▼
virtual:silverkey-wiki  →  { tree, pages }
        │
        ▼
AdminWikiSection + WikiTreeNav / WikiArticle
```

Page paths are slash-separated paths relative to `documentation/` without the `.md` suffix (e.g. `features/admin/admin-wiki`).

## Authoring rules

This Wiki is the `documentation/` tree. Follow [how-we-document.md](../../how-we-document.md): as-built hubs only, kebab-case filenames, no roadmap trees.

## Related

- [admin.md](./admin.md)
- [reference/vite-configuration.md](../../reference/vite-configuration.md)
- Ticket: [SIL-317](https://linear.app/silverkey/issue/SIL-317)
