# Google Calendar Settings
GOOGLE_CLIENT_ID = "24810096801-7e7o2ku0f6t053sid2a2o2l1be6orj01.apps.googleusercontent.com"

# Use calendar.app.created (non-sensitive scope) - allows managing only calendars/events created by the app
# This scope does NOT require OAuth verification
# NOTE: This should match permissions['calendar_app_created']['scope_url'] from
# app.services.calendar.permissions.constants. The service validates this at runtime.
GOOGLE_SCOPES = "https://www.googleapis.com/auth/calendar.app.created"

