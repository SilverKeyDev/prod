/** Profile feature translation strings. */
import { ACTION_LABELS } from "packages/utils/product/domain/actionLabels";

export const PROFILE_TRANSLATIONS: Record<string, string> = {
  // Favorite homes dropdown (shared UI; list from profile)
  "favorite_homes.placeholder": "Select a saved home…",
  "favorite_homes.loading_homes": "Loading saved homes…",
  "favorite_homes.bed_bath": "{{beds}} bed • {{baths}} bath",
  "favorite_homes.selected_property": "Saved property",
  "favorite_homes.choose_saved_properties": "Choose from your saved properties",
  "favorite_homes.no_favorite_homes_found": "No saved homes yet.",
  "favorite_homes.property_details": "Property details",

  "profile.account.edit": "Edit",
  "profile.account.cancel": "Cancel",
  "profile.account.saving_save": "Saving...",
  "profile.sections.not_specified": "Not specified",
  "profile.account.save": ACTION_LABELS.SAVE,

  "profile.agent.public_profile_link_label": "Your public profile link",
  "profile.agent.public_link_hint":
    "Share this link with clients so they can view your public profile and connect with you on SilverKey.",
  "profile.agent.copy_link": "Copy link",
  "profile.agent.open_link": "Open link",
  "profile.agent.share": ACTION_LABELS.SHARE,
  "profile.agent.share_sheet_title": "{{name}} — SilverKey",
  "profile.agent.share_sheet_text":
    "View my public agent profile on SilverKey.",
  "profile.agent.link_copied": "Link copied to clipboard",
  "profile.agent.copy_failed": "Could not copy link",

  "profile.public.loading": "Loading profile…",
  "profile.public.agent_not_found_title": "Agent not found",
  "profile.public.invalid_link_body": "This profile link is invalid.",
  "profile.public.load_error_title": "Unable to load profile",
  "profile.public.generic_error": "Something went wrong.",
  "profile.public.unavailable_body":
    "This agent profile is unavailable or the link may be incorrect.",
  "profile.public.back_home": "Back to home",
  "profile.public.back_to_dashboard": "Back to dashboard",
  "profile.public.contact_heading": "Contact",
  "profile.public.contact_subtitle":
    "How clients can reach you on your public profile.",
  "profile.public.email_label": "Email",
  "profile.public.phone_label": "Phone",
  "profile.public.mls_id_label": "MLS ID",
  "profile.public.mls_affiliations_heading": "MLS affiliations",
  "profile.public.social_links_heading": "Social and links",
  "profile.public.hero_fallback_name": "Agent",
  "profile.public.photo_aria": "Profile photo, {{name}}",
  "profile.public.licenses_heading": "Licenses and service area",
  "profile.public.licenses_subtitle":
    "States, license details, and where this agent focuses.",

  "profile.public.connect_cta": "Connect",
  "profile.public.connect_modal_title": "Sign in to connect",
  "profile.public.connect_modal_title_with_agent": "Connect with {{agentName}}",
  "profile.public.connect_modal_body":
    "Create an account or sign in to send a connection request to this agent.\n\nWe will connect you automatically after you are signed in.",
  "profile.public.connect_modal_body_with_agent":
    "Sign in or create an account and we'll connect you with {{agentName}} automatically.",
  "profile.public.connect_banner":
    "After signing in, you'll be connected with {{agentName}}.",
  "profile.public.connect_sign_in": "Sign in",
  "profile.public.connect_create_account": "Create an account",
  "profile.public.connect_toast_success": "Connection request sent",
  "profile.public.connect_toast_pending":
    "A connection request is already pending with this agent.",
  "profile.public.connect_resume_error":
    "Could not complete your connection automatically. Open this profile again and tap Connect.",
  "profile.public.connect_request_error": "Failed to send connection request",
  "profile.public.connect_profile_not_ready":
    "Profile not loaded. Please try again in a moment.",

  // Buyer onboarding — About Me (SIL-182)
  "profile.onboarding.about.title": "About you",
  "profile.onboarding.about.subtitle":
    "Help us personalize your search and how we stay in touch. Everything stays on this one screen.",
  "profile.onboarding.about.moving_with.label": "Who's moving with you?",
  "profile.onboarding.about.moving_with.just_me": "Just me",
  "profile.onboarding.about.moving_with.partner": "Partner or spouse",
  "profile.onboarding.about.moving_with.kids": "Kids",
  "profile.onboarding.about.moving_with.other_family": "Other family",
  "profile.onboarding.about.moving_with.roommates": "Roommates",
  "profile.onboarding.about.kids_ages.label": "How old are they?",
  "profile.onboarding.about.kids_ages.placeholder": "e.g. 8",
  "profile.onboarding.about.pets.label": "Any pets?",
  "profile.onboarding.about.pets.yes": "Yes",
  "profile.onboarding.about.pets.no": "No",
  "profile.onboarding.about.pet_types.label": "What kind of pets?",
  "profile.onboarding.about.pet_types.dog": "Dog",
  "profile.onboarding.about.pet_types.cat": "Cat",
  "profile.onboarding.about.pet_types.other": "Other",
  "profile.onboarding.about.move_motivation.label":
    "What's got you looking to move right now?",
  "profile.onboarding.about.move_motivation.placeholder":
    "Optional — tell us what's driving the move",

  // Buyer onboarding — Financing (SIL-182)
  "profile.onboarding.financing.title": "Financing",
  "profile.onboarding.financing.subtitle":
    "Share where you are in the process so we can tailor listings and next steps.",
  "profile.onboarding.financing.lender_status.label":
    "Have you talked to a lender yet?",
  "profile.onboarding.financing.lender_status.pre_approved":
    "Yes, I'm pre-approved",
  "profile.onboarding.financing.lender_status.pre_qualified":
    "Yes, pre-qualified",
  "profile.onboarding.financing.lender_status.not_yet": "Not yet",
  "profile.onboarding.financing.lender_name.label": "Who are you working with?",
  "profile.onboarding.financing.lender_name.placeholder": "Lender or bank name",
  "profile.onboarding.financing.want_lender_connection.label":
    "Want us to connect you with a lender?",
  "profile.onboarding.financing.want_lender_connection.yes": "Yes",
  "profile.onboarding.financing.want_lender_connection.no": "No",
  "profile.onboarding.financing.payment_method.label":
    "How are you planning to pay?",
  "profile.onboarding.financing.payment_method.financing": "Financing",
  "profile.onboarding.financing.payment_method.cash": "Cash",
  "profile.onboarding.financing.gross_income.label": "Gross annual income",
  "profile.onboarding.financing.gross_income.placeholder": "Before taxes",
  "profile.onboarding.financing.loan_type.label":
    "What kind of loan are you thinking?",
  "profile.onboarding.financing.loan_type.conventional": "Conventional",
  "profile.onboarding.financing.loan_type.fha": "FHA",
  "profile.onboarding.financing.loan_type.va": "VA",
  "profile.onboarding.financing.loan_type.not_sure": "Not sure",
  "profile.onboarding.financing.down_payment_band.label":
    "How much are you thinking for a down payment?",
  "profile.onboarding.financing.down_payment_band.less_5": "Less than 5%",
  "profile.onboarding.financing.down_payment_band.5_10": "5–10%",
  "profile.onboarding.financing.down_payment_band.10_20": "10–20%",
  "profile.onboarding.financing.down_payment_band.20_plus": "20%+",
  "profile.onboarding.financing.down_payment_band.not_sure": "Not sure",
  "profile.onboarding.financing.first_home.label": "Is this your first home?",
  "profile.onboarding.financing.first_home.yes": "Yes, first home",
  "profile.onboarding.financing.first_home.no": "No, I've bought before",
  "profile.onboarding.financing.price_range.label":
    "What price range feels comfortable?",
  "profile.onboarding.financing.price_range.min_placeholder": "Min",
  "profile.onboarding.financing.price_range.max_placeholder": "Max",
  "profile.onboarding.financing.max_monthly.label":
    "Any monthly payment you want to stay under?",
  "profile.onboarding.financing.max_monthly.placeholder": "Optional",
  "profile.onboarding.financing.credit.label": "How's your credit looking?",
  "profile.onboarding.financing.credit.excellent": "Excellent (740+)",
  "profile.onboarding.financing.credit.good": "Good (670–739)",
  "profile.onboarding.financing.credit.fair": "Fair (580–669)",
  "profile.onboarding.financing.credit.working_on_it": "Working on it",
  "profile.onboarding.financing.credit.unknown": "Not sure",
  "profile.onboarding.financing.rent_or_own.label":
    "Do you currently rent or own?",
  "profile.onboarding.financing.rent_or_own.rent": "Rent",
  "profile.onboarding.financing.rent_or_own.own": "Own",
  "profile.onboarding.financing.need_to_sell.label":
    "Do you need to sell your current place first?",
  "profile.onboarding.financing.need_to_sell.yes": "Yes",
  "profile.onboarding.financing.need_to_sell.no": "No",
  "profile.onboarding.financing.need_to_sell.not_sure": "Not sure",
  "profile.onboarding.financing.move_timeline.label":
    "When you find the right place, how soon do you want to move?",
  "profile.onboarding.financing.move_timeline.asap": "ASAP",
  "profile.onboarding.financing.move_timeline.1_3_months": "1–3 months",
  "profile.onboarding.financing.move_timeline.3_6_months": "3–6 months",
  "profile.onboarding.financing.move_timeline.just_browsing": "Just browsing",
  "profile.onboarding.financing.affordability_zip_hint":
    "Add an important location on the Location step for a tax-aware affordability estimate.",
};
