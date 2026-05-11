/**
 * One shared Promise per dashboard lazy chunk so `import()` from prefetch and
 * `React.lazy()` reuse the same module load (same chunk URL, one network parse).
 * Without this, some builds/dev timings can resolve prefetch quickly while a
 * later lazy boundary still pays full fetch/eval cost.
 */
let clientListModulePromise: Promise<typeof import("./ClientList/ClientList")> | null = null;
let dashboardChecklistsModulePromise: Promise<
  typeof import("./DashboardChecklists/DashboardChecklists")
> | null = null;
let dashboardCalendarPanelModulePromise: Promise<typeof import("./DashboardCalendarPanel")> | null =
  null;
let dashboardAgreementSigningModalsModulePromise: Promise<
  typeof import("./DashboardAgreementSigningModals")
> | null = null;
let upcomingEventsModulePromise: Promise<
  typeof import("packages/features/calendar/components/agenda/UpcomingEvents")
> | null = null;

export function loadClientListModule(): Promise<typeof import("./ClientList/ClientList")> {
  clientListModulePromise ??= import("./ClientList/ClientList");
  return clientListModulePromise;
}

export function loadDashboardChecklistsModule(): Promise<
  typeof import("./DashboardChecklists/DashboardChecklists")
> {
  dashboardChecklistsModulePromise ??= import("./DashboardChecklists/DashboardChecklists");
  return dashboardChecklistsModulePromise;
}

export function loadDashboardCalendarPanelModule(): Promise<
  typeof import("./DashboardCalendarPanel")
> {
  dashboardCalendarPanelModulePromise ??= import("./DashboardCalendarPanel");
  return dashboardCalendarPanelModulePromise;
}

export function loadDashboardAgreementSigningModalsModule(): Promise<
  typeof import("./DashboardAgreementSigningModals")
> {
  dashboardAgreementSigningModalsModulePromise ??= import("./DashboardAgreementSigningModals");
  return dashboardAgreementSigningModalsModulePromise;
}

/** Agenda / upcoming list (heavy calendar UI); split from `DashboardFeature` for faster first commit. */
export function loadUpcomingEventsModule(): Promise<
  typeof import("packages/features/calendar/components/agenda/UpcomingEvents")
> {
  upcomingEventsModulePromise ??=
    import("packages/features/calendar/components/agenda/UpcomingEvents");
  return upcomingEventsModulePromise;
}
