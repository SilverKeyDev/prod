export type AgendaTodoDTO = {
  id: string;
  title: string;
  description?: string | null;
  due_date: string | null;
  completed: boolean;
  /** DocuSign item merged into the agenda; row opens signing instead of a checkbox. */
  agenda_item_kind?: "todo" | "signing";
  /** Agreement id in the document library; set when `agenda_item_kind` is `"signing"`. */
  signing_agreement_id?: string;
  /** ISO datetime when the viewer finished signing; used to order completed DocuSign rows. */
  signing_completed_at?: string | null;
};
