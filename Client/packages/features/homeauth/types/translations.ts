/** Auth (homeauth) translation strings. */
export const AUTH_TRANSLATIONS: Record<string, string> = {
  "auth.method.google_oauth": "Google OAuth",
  "auth.method.email_password": "Email & Password",
  "auth.method.linked": "Linked Account",
  "auth.method.unknown": "Unknown",
  "auth.description.google":
    "You signed up with Google. Sign in using the 'Continue with Google' button.",
  "auth.description.cognito": "You signed up with email and password.",
  "auth.description.both": "Your account is linked to both email/password and Google.",
  "auth.description.unknown": "Authentication method not detected.",
  "auth.limitation.google":
    "Password reset and email verification are not available for Google OAuth accounts.",
  "auth.limitation.google_display":
    "⚠️ Password reset and email verification are not available for Google OAuth accounts.",
  "auth.suggestion.cognito": "You can link your Google account for easier sign-in.",
  "auth.suggestion.cognito_display": "💡 You can link your Google account for easier sign-in.",
  "auth.benefit.both": "You can sign in using either method for maximum flexibility.",
  "auth.benefit.both_display": "✅ You can sign in using either method for maximum flexibility.",
  "auth.suggestion.unknown": "Please contact support if you experience any issues.",
  "auth.suggestion.unknown_display": "💡 Please contact support if you experience any issues.",
  "auth.footer.privacy_policy": "Privacy Policy",
  "auth.footer.terms_of_service": "Terms of Service",
  "auth.footer.contact_us": "Contact Us",
  "auth.footer.copyright": "All rights reserved.",
};
