// Shared section titles and field labels for profile and onboarding

export const SECTION_TITLES = {
  FINANCIAL_PROFILE: "Finances",
  HOUSING_PREFERENCES: "Housing",
  /** Beds, baths, home type, listing type, must-haves. */
  HOUSING_ESSENTIALS: "Essentials",
  /** Tag + style dropdown groups (profile step title). */
  HOUSING_DETAILS: "Details and style",
  /** Square feet, lot size, home age, days on market. */
  HOUSING_RANGES: "Size & age",
  /** Free-form tags (e.g. street parking). */
  HOUSING_OTHER_REQUIREMENTS: "Other requirements",
  /** Architectural style, walkability, intended use, renovation. */
  HOUSING_STYLE_AND_USE: "Style and how you'll use it",
  LOCATION_PREFERENCES: "Location",
  SEARCH_PREFERENCES: "Search preferences",
  SEARCH_PREFS_PRICE_FINANCING: "Price and financing",
  SEARCH_PREFS_LOCATION: "Location preferences",
  SEARCH_PREFS_PHYSICAL: "Physical features",
  SEARCH_PREFS_CONDITION: "Condition and listing status",
  SEARCH_PREFS_UTILITIES: "Utilities and systems",
  SEARCH_PREFS_NEIGHBORHOOD: "Neighborhood",
  /** Privacy, data export, and account deletion (profile / settings). */
  PRIVACY_DATA: "Privacy & data",
  /** Combined physical + condition + utilities step title. */
  SEARCH_PROPERTY_STEP: "Features",
  /** Weekly availability editor (agents only; shown in profile, not onboarding). */
  AVAILABILITY: "Availability",
  /** First onboarding step: buyer / seller / agent / integration partner. */
  ONBOARDING_ROLE: "Who I am",
  COMMUNICATION_PREFERENCES: "Communication",
  AGENT_PROFESSIONAL_INFO: "Professional Info",
  AGENT_BROKERAGE: "Brokerage",
  AGENT_LICENSING: "Licensing",
  AGENT_PROFILE_AND_SERVICE: "Service Area",
} as const;

/** Location section subtitle (web and native). */
export const LOCATION_SUBTITLE =
  "Locations set your exact search range. Add work, family, and notes for neighborhoods, school districts, or school ratings.";

/** Availability section subtitle (agents only). */
export const AVAILABILITY_SUBTITLE =
  "Set times you are usually available for clients to see when they book with you. This schedule is saved with your professional profile and is separate from your Google Calendar. Double-click a time in week view to add a block; use “Repeat every week” for a recurring slot.";

// Shared field labels
export const FIELD_LABELS = {
  // Demographics
  NAME: "Name",
  ONBOARDING_ROLE_HEADLINE: "I am a…",
  ONBOARDING_ROLE_SUBTITLE:
    "Choose the option that best describes you. We use this only to personalize your experience—details can live in your profile later.",
  ONBOARDING_ROLE_BUYER: "Buyer",
  ONBOARDING_ROLE_SELLER: "Seller",
  ONBOARDING_ROLE_AGENT: "Real estate agent",
  ONBOARDING_ROLE_INTEGRATION_PARTNER: "Integration partner",
  ONBOARDING_ROLE_BROKERAGE: "Brokerage",
  AGE: "Age",
  WHY_JOINING_SILVERKEY: "Why are you joining SilverKey?",
  GENDER: "Gender",
  MARITAL_STATUS: "Marital Status",
  OCCUPATION: "Occupation",
  PETS: "Pet Ownership Status",
  CHILDREN_COUNT: "Number of Children",

  // Financial
  PAYING_WITH_CASH: "Paying with cash?",
  GROSS_INCOME: "Gross Annual Income",
  HOME_BUDGET: "Budget Range",
  CREDIT_SCORE_RANGE: "Credit Score Range",
  DOWN_PAYMENT: "Down Payment",
  IDEAL_ZIP_CODE: "Ideal Zip Code",

  // Housing
  PREFERRED_HOUSING_TYPE: "Home Type",
  PREFERRED_BEDROOMS: "Bedrooms",
  PREFERRED_BATHROOMS: "Bathrooms",
  PREFERRED_LOT_SIZE: "Lot Size",
  PREFERRED_HOME_AGE: "Home Age",
  MUST_HAVE: "Must-have",
  SQUARE_FEET: "Square feet",
  LISTING_TYPE: "Listing type",
  DAYS_ON_MARKET: "Days on market",
  PREFERRED_ARCHITECTURAL_STYLE: "Architectural Style",
  RENOVATION_PREFERENCE: "Renovation Willingness",
  INTENDED_PROPERTY_USE: "Intended Property Use",
  OTHER_REQUIREMENTS: "Other Requirements",
  PREFERRED_HOME_FEATURES: "Preferred Features",
  DEAL_BREAKERS: "Deal Breakers",

  // Location
  IMPORTANT_LOCATIONS: "Important Locations for Commute",
  WALKABILITY_IMPORTANCE: "Walkability Importance",
  LISTING_STATUS_FILTER: "MLS listing status",
  BUDGET_SUMMARY_SEARCH_PREFS: "Your budget (from Finances)",
  EDIT_BUDGET_IN_FINANCES: "Edit budget in the Finances tab.",
  HOA_OK: "OK with HOA",
  HOA_FEE_MAX: "Max HOA fee (monthly)",
  FLOOD_IMPORTANCE: "Flood or hazard importance",
  NOISE_IMPORTANCE: "Noise sensitivity",
  GARAGE_REQUIRED: "Garage required",
  GARAGE_MIN_CARS: "Garage spaces (min)",
  STORIES_PREFERENCE: "Stories / levels",
  PARKING_TYPE: "Parking type",
  ACCESSIBILITY_NEEDS: "Accessibility",
  OUTDOOR_SPACE: "Outdoor space importance",
  FIREPLACE: "Fireplace preference",
  VIEW_IMPORTANCE: "View importance",
  PREFER_PRICE_REDUCED: "Prefer price-reduced listings",
  PREFER_VIRTUAL_TOUR: "Prefer virtual tour available",
  PREFER_OPEN_HOUSE: "Prefer open house scheduled",
  FORECLOSURE_OK: "OK with foreclosure / auction",
  HVAC_PREFERENCE: "HVAC preference",
  UTILITIES_INCLUDED: "Utilities included importance",
  SOLAR_INTEREST: "Solar interest",
  EV_CHARGER_INTEREST: "EV charging interest",
  CRIME_IMPORTANCE: "Crime / safety importance",
  PET_FRIENDLY_AREA: "Pet-friendly area importance",

  // Communication
  COMMUNICATION_FREQUENCY: "Communication Frequency",
  INFORMATION_DETAIL_LEVEL: "Information Detail Level",
  HAS_BUYERS_AGENT: "Do you currently have a buyer's agent?",
  LOOKING_FOR_BUYERS_AGENT: "I'm looking for a buyer's agent",

  // Agent profile (Professional Info)
  AGENT_BROKERAGE_NAME: "Brokerage Name",
  AGENT_BROKERAGE_BIC: "Brokerage BIC Name",
  AGENT_BROKERAGE_ADDRESS: "Brokerage Address",
  AGENT_BROKERAGE_EMAIL: "Brokerage Email",
  AGENT_BROKERAGE_PHONE: "Brokerage Phone",
  AGENT_PHYSICAL_MAILING_ADDRESS: "Physical Mailing Address",
  AGENT_LICENSED_STATES: "Licensed States",
  AGENT_LICENSE_TYPES: "License Types",
  AGENT_LICENSE_NUMBERS: "License Numbers",
  AGENT_LICENSE_EXPIRATION_DATES: "License Expiration Dates",
  AGENT_BIO: "Bio",
  AGENT_PRIMARY_SERVICE_ZIPS: "Primary Service Zips",
  AGENT_SPECIALTIES: "Specialties",
} as const;

/** Buyer-preference copy when the signed-in user is an agent (personal search only). */
export const AGENT_OPTIONAL_BUYER_SEARCH_PREFERENCES_HINT =
  "Optional for agents. Complete this only for personal search recommendations.";

export const AGENT_OPTIONAL_BUYER_LOCATION_PREFERENCES_HINT =
  "Optional for agents. Add locations here only for personal search recommendations.";

export const AGENT_OPTIONAL_BUYER_FINANCIAL_HINT =
  "Optional for agents. Complete this only for personal affordability and search recommendations.";
