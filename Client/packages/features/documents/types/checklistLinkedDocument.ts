/**
 * Documents linked to a checklist step (SkySlope / transaction APIs).
 * Server responses may use legacy field names; client maps to this shape.
 */
export type ChecklistLinkedDocument = {
  id: string;
  title: string;
  status: string;
};
