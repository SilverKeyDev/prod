permissions = {
    "userinfo_email": {
        "field_name": "has_userinfo_email",
        "scope_url": "https://www.googleapis.com/auth/userinfo.email",
        "description": "See your primary Google Account email address",
    },
    "userinfo_profile": {
        "field_name": "has_userinfo_profile",
        "scope_url": "https://www.googleapis.com/auth/userinfo.profile",
        "description": "See your personal info, including any personal info you've made publicly available",
    },
    "openid": {
        "field_name": "has_openid",
        "scope_url": "openid",
        "description": "Associate you with your personal info on Google",
    },
    "calendar_freebusy": {
        "field_name": "has_calendar_freebusy",
        "scope_url": "https://www.googleapis.com/auth/calendar.freebusy",
        "description": "View your availability in your calendars",
        # Scopes that also satisfy freebusy.query authorization
        "implied_by": [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events.freebusy",
        ],
    },
    "calendar_app_created": {
        "field_name": "has_calendar_app_created",
        "scope_url": "https://www.googleapis.com/auth/calendar.app.created",
        "description": "Make secondary Google calendars, and see, create, change, and delete events on them",
        "implied_by": [
            "https://www.googleapis.com/auth/calendar",
        ],
    },
    "calendar_calendarlist_readonly": {
        "field_name": "has_calendar_calendarlist_readonly",
        "scope_url": "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
        "description": "See the list of Google calendars you're subscribed to",
        "implied_by": [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.calendarlist",
        ],
    },
    "calendar_events_freebusy": {
        "field_name": "has_calendar_events_freebusy",
        "scope_url": "https://www.googleapis.com/auth/calendar.events.freebusy",
        "description": "See the availability on Google calendars you have access to",
        # Scopes that also satisfy freebusy.query authorization
        "implied_by": [
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.freebusy",
        ],
    },
    # Full Calendar access (required for ACL / calendarList.insert on arbitrary calendars, etc.).
    # Granted scope is tracked in token.scopes; no separate DB column (field_name None).
    "calendar": {
        "field_name": None,
        "scope_url": "https://www.googleapis.com/auth/calendar",
        "description": "Full access to your calendars, including sharing and access control (ACLs)",
    },
}
