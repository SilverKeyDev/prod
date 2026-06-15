/** Admin workspace copy (wired to LocalizationContext). */
export const ADMIN_TRANSLATIONS: Record<string, string> = {
  "admin.dev_persona.nav_label": "Dev preview",
  "admin.dev_persona.title": "Development preview",
  "admin.dev_persona.description":
    "Switch your account to any customer workspace persona for local QA. Updates server identity and workspace UX the same way production does.",
  "admin.dev_persona.persona_title": "Active persona",
  "admin.dev_persona.persona_description":
    "Choose buyer, seller, agent, brokerage, or integration partner. Only one persona is active at a time.",
  "admin.dev_persona.persona_warning":
    "Warning: this updates your real database user (`user_roles`, and onboarding demographics). Reload or revisit profile if other UI does not reflect the server immediately.",
  "admin.dev_persona.persona_unknown": "Unknown persona",
  "admin.dev_persona.banner_prefix": "Dev persona:",
  "admin.dev_persona.open_settings": "Open dev preview",
  "admin.dev_reset.title": "Reset test data",
  "admin.dev_reset.description":
    "Clear profile, buyer preferences, DocuSign, checklist progress, uploads, or agent connections for faster local testing. Does not delete your account or admin roles.",
  "admin.dev_reset.warning":
    "Warning: this permanently removes the selected data from the database for the target user.",
  "admin.dev_reset.scope_profile": "Profile (agent public profile and presentation fields)",
  "admin.dev_reset.scope_preferences":
    "Preferences (search intent, financials, demographics, locations)",
  "admin.dev_reset.scope_docusign": "DocuSign (OAuth connection and agreements)",
  "admin.dev_reset.scope_transaction_steps":
    "Transaction steps (checklist progress, saved address, step views)",
  "admin.dev_reset.scope_s3": "S3 uploads (documents, images, reports, profile picture files)",
  "admin.dev_reset.scope_connections":
    "Connections (agent/client links, chats, connection requests, todos)",
  "admin.dev_reset.target_user_id_label": "Target user ID (optional)",
  "admin.dev_reset.target_user_id_placeholder": "User UUID — leave empty to reset yourself",
  "admin.dev_reset.target_user_id_hint": "Super admin only: reset another user by UUID.",
  "admin.dev_reset.reset_button": "Reset selected data",
  "admin.dev_reset.resetting": "Resetting…",
  "admin.dev_reset.success": "Reset {scopes} for user {userId}.",
  "admin.dev_reset.error_no_scopes": "Select at least one data scope to reset.",
  "admin.dev_reset.error_generic": "Reset failed",
};
