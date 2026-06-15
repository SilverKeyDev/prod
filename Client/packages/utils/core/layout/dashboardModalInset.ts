/**
 * While the authenticated dashboard shell is mounted, `DashboardLayout` sets this on
 * `document.documentElement`. Portaled modal roots use the `fixed-modal-dashboard-main`
 * utility (see `packages/ui/styles/css/utilities.css`) so overlays align with `#main-content`
 * instead of the full viewport (desktop sidebar matches `w-52`).
 */
export const DASHBOARD_MODAL_INSET_LEFT_VAR = "--sk-dashboard-modal-inset-left";

/** Matches Tailwind `w-52` on the dashboard sidebar column. */
export const DASHBOARD_SIDEBAR_WIDTH_CSS = "13rem";
