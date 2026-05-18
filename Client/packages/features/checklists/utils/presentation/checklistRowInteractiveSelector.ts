/**
 * Elements inside a checklist item row that handle their own press targets.
 * Row-level expand/handoff handlers must ignore clicks that originate here.
 */
export const CHECKLIST_ROW_INTERACTIVE_SELECTOR =
  "button, a[href], input, textarea, select, [role='listbox'], [role='option'], [role='combobox'], [role='menu'], [role='menuitem'], [data-radix-popper-content-wrapper], [data-radix-dropdown-menu-content], [data-radix-select-content]";
