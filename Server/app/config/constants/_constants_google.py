# Google Calendar Settings
GOOGLE_CLIENT_ID = "24810096801-7e7o2ku0f6t053sid2a2o2l1be6orj01.apps.googleusercontent.com"

# Space-separated scopes matching oauth_requested_scope_urls() in
# app.services.calendar.permissions.constants (keep in sync; no import here — avoids circular config load).
# Excludes full Calendar and calendar.events.freebusy.
GOOGLE_SCOPES = (
    "https://www.googleapis.com/auth/userinfo.email "
    "https://www.googleapis.com/auth/userinfo.profile "
    "openid "
    "https://www.googleapis.com/auth/calendar.freebusy "
    "https://www.googleapis.com/auth/calendar.app.created "
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
)
