# 404, route errors, and “500” experience

## 404 (in-app)

- **Implementation:** `Client/apps/web/pages/misc/NotFoundPage.tsx` — catch-all `path="*"` in `Client/apps/web/app/routes.tsx`.
- **Manual test:** open a path that is not registered, e.g. `/this-route-does-not-exist-qa-test`.
- **Expected:** “Page not found” (or equivalent) and **Go to home**; no blank screen.
## Route / loader / React errors (in-app)

- **Implementation:** `RouteErrorBoundary` — `Client/apps/web/app/error/RouteErrorBoundary.tsx` (parent layout uses `errorElement={<RouteErrorBoundary />}` in `routes.tsx`).
- Handles `useRouteError` / `isRouteErrorResponse` (including status **404** in router responses) and a generic “Route Error” with **Go home**, **Go back**, **Retry** where implemented.
- **There is no dedicated `/500` route** in the client router. “500 experience” in-app = **error boundary UI**, not a static `/500` URL.

## Infrastructure 500 (outside the SPA)

If the **origin** or **load balancer** returns 5xx before the SPA loads, users may see a **hosting** default page (e.g. Nginx, CloudFront). That is an **infra** concern; document your CDN/error page in runbooks separate from the React app.

**Checklist**

- [ ] 404 in-app (manual on each major browser)
- [ ] Thrown route error / boundary (manual, or dev route that throws) — user can recover
- [ ] (Ops) Branded static error page at CDN, if required by product

## Related

- [error-states.md](./error-states.md)
- [end-to-end-qa-runbook.md](./end-to-end-qa-runbook.md)
