import type { UpcomingAgendaItem } from "@/features/calendar/types/upcomingAgenda";

export type AgendaDisplayCategory = "signing" | "todo" | "event";

export const AGENDA_DISPLAY_CATEGORY_ORDER: AgendaDisplayCategory[] = ["signing", "todo", "event"];

export const AGENDA_DISPLAY_CATEGORY_OPTIONS: {
  value: AgendaDisplayCategory;
  label: string;
}[] = [
  { value: "signing", label: "DocuSign" },
  { value: "todo", label: "To-dos" },
  { value: "event", label: "Calendar" },
];

export const ALL_AGENDA_DISPLAY_CATEGORIES: AgendaDisplayCategory[] = AGENDA_DISPLAY_CATEGORY_ORDER;

const CATEGORY_ORDER_INDEX = new Map(
  AGENDA_DISPLAY_CATEGORY_ORDER.map((category, index) => [category, index])
);

export function getAgendaDisplayCategory(item: UpcomingAgendaItem): AgendaDisplayCategory {
  if (item.kind === "event") {
    return "event";
  }
  if (item.todo.agenda_item_kind === "signing") {
    return "signing";
  }
  return "todo";
}

export function agendaDisplayCategoryOrderIndex(category: AgendaDisplayCategory): number {
  return CATEGORY_ORDER_INDEX.get(category) ?? Number.MAX_SAFE_INTEGER;
}

export function filterAgendaByDisplayCategories(
  items: UpcomingAgendaItem[],
  selected: ReadonlySet<AgendaDisplayCategory>
): UpcomingAgendaItem[] {
  if (selected.size === 0) {
    return [];
  }
  return items.filter((item) => selected.has(getAgendaDisplayCategory(item)));
}

export type CompareAgendaItemsOptions = {
  descending?: boolean;
};

/**
 * Primary sort: DocuSign → to-dos → calendar. Secondary: caller-supplied timestamp within each group.
 */
export function compareAgendaItemsByTypeThenDate(
  a: UpcomingAgendaItem,
  b: UpcomingAgendaItem,
  getTimestampMs: (item: UpcomingAgendaItem) => number,
  options?: CompareAgendaItemsOptions
): number {
  const categoryA = agendaDisplayCategoryOrderIndex(getAgendaDisplayCategory(a));
  const categoryB = agendaDisplayCategoryOrderIndex(getAgendaDisplayCategory(b));
  if (categoryA !== categoryB) {
    return categoryA - categoryB;
  }

  const descending = options?.descending ?? false;
  const ta = getTimestampMs(a);
  const tb = getTimestampMs(b);
  if (ta !== tb) {
    return descending ? tb - ta : ta - tb;
  }
  return 0;
}
