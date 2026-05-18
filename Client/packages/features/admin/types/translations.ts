/** Admin workspace copy (wired to LocalizationContext). */
export const ADMIN_TRANSLATIONS: Record<string, string> = {
  "admin.dev_persona.nav_label": "App persona",
  "admin.dev_persona.title": "Development app persona",
  "admin.dev_persona.description":
    "Switch the signed-in account’s agent flag for layout and API access. This updates the real `users.is_agent` column. Buyer vs seller follows your `user_roles` when the account is in client mode (both use the client shell).",
  "admin.dev_persona.warning":
    "Warning: this changes your database user row (`users.is_agent`). Reload or revisit profile if the UI does not reflect the server immediately.",
  "admin.dev_persona.persona_agent": "Agent",
  "admin.dev_persona.persona_broker": "Broker",
  "admin.dev_persona.persona_buyer": "Buyer",
  "admin.dev_persona.persona_seller": "Seller",
  "admin.dev_persona.broker_note":
    "Broker currently uses the same shell and API shape as Agent (placeholder).",
  "admin.dev_persona.applying": "Applying…",
  "admin.dev_persona.banner_prefix": "Dev persona:",
  "admin.dev_persona.banner_agent_shell": "(agent shell)",
  "admin.dev_persona.banner_client_shell": "(client shell)",
  "admin.dev_persona.open_settings": "Open app persona",
  "admin.dev_reset.title": "Reset test data",
  "admin.dev_reset.description":
    "Clear profile, buyer preferences, or DocuSign records for faster local testing. Does not delete your account or admin roles.",
  "admin.dev_reset.warning":
    "Warning: this permanently removes the selected data from the database for the target user.",
  "admin.dev_reset.scope_profile": "Profile (agent public profile and presentation fields)",
  "admin.dev_reset.scope_preferences":
    "Preferences (search intent, financials, demographics, locations)",
  "admin.dev_reset.scope_docusign": "DocuSign (OAuth connection and agreements)",
  "admin.dev_reset.target_user_id_label": "Target user ID (optional)",
  "admin.dev_reset.target_user_id_placeholder": "User UUID — leave empty to reset yourself",
  "admin.dev_reset.target_user_id_hint": "Super admin only: reset another user by UUID.",
  "admin.dev_reset.ack_label": "I understand this permanently deletes the selected data",
  "admin.dev_reset.reset_button": "Reset selected data",
  "admin.dev_reset.resetting": "Resetting…",
  "admin.dev_reset.success": "Reset {scopes} for user {userId}.",
  "admin.dev_reset.error_no_scopes": "Select at least one data scope to reset.",
  "admin.dev_reset.error_ack_required": "Confirm that you understand this action is permanent.",
  "admin.dev_reset.error_generic": "Reset failed",
};
