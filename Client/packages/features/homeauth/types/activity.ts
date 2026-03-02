// Activity type (app-level)

export type Activity = {
  id: string;
  user_id: string;
  action: string;
  description: string;
  entity_type: string; // 'report', 'offer', 'document', etc.
  entity_id: string;
  metadata?: unknown;
  created_at: Date;
};
