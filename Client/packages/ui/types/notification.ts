// Notification type (app-level)

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "report" | "offer" | "document" | "system" | "agent";
  is_read: boolean;
  action_url?: string;
  action_text?: string;
  created_at: Date;
  expires_at?: Date;
};
