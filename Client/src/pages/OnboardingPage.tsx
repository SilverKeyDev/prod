import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Home,
  MapPin,
  Heart,
  Brain,
  Building,
  MessageSquare,
  Lightbulb,
  Plus,
  X,
} from "lucide-react";

interface OnboardingData {
  age?: number;
  gender?: string;
  marital_status?: string;
  household_size?: number;
  children_count?: number;
  children_ages?: number[];
  education_level?: string;
  occupation?: string;
  industry?: string;
  employment_status?: string;
  income_range?: string;
  preferred_home_price_range?: string;
  credit_score_range?: string;
  savings_amount_range?: string;
  investment_experience?: string;
  risk_tolerance?: string;
  desired_housing_type?: string;
  preferred_bathrooms?: number;
  preferred_bedrooms?: number;
  preferred_lot_size?: string;
  preferred_home_age?: string;
  preferred_architectural_style?: string;
  preferred_home_features?: string[];
  preferred_regions?: string[];
  preferred_climate?: string;
  urban_rural_preference?: string;
  commute_tolerance?: number;
  proximity_to_family?: string;
  walkability_importance?: string;
  lifestyle_type?: string;
  hobbies_interests?: string[];
  dining_preferences?: string[];
  fitness_activities?: string[];
  decision_making_style?: string;
  research_behavior?: string;
  favored_information_style?: string;
  political_leaning?: string;
  community_involvement?: string;
  property_search_stage?: string;
  home_buying_experience?: string;
  financing_preference?: string;
  property_features_priority?: string[];
  deal_breakers?: string[];
  renovation_willingness?: string;
  intended_property_use?: string;
  timeline_to_purchase?: string;
  current_home_ownership_status?: string;
  moving_reason?: string;
  preferred_support_channel?: string;
  communication_frequency?: string;
  information_detail_level?: string;
  meeting_preference?: string;
  quote_bubbles?: string[];
  deal_makers?: string[];
  concerns_or_fears?: string[];
}

const STEPS = [
  { id: "demographics", title: "About You", icon: User },
  { id: "financial", title: "Financial Profile", icon: Building },
  { id: "housing", title: "Housing Preferences", icon: Home },
  { id: "location", title: "Location Preferences", icon: MapPin },
  { id: "lifestyle", title: "Lifestyle", icon: Heart },
  { id: "behavior", title: "Preferences", icon: Brain },
  { id: "realestate", title: "Real Estate Goals", icon: Building },
  { id: "communication", title: "Communication", icon: MessageSquare },
  { id: "insights", title: "Personal Insights", icon: Lightbulb },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load formData from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem("onboardingDraft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
      } catch (e) {
        console.warn("Invalid onboarding draft data");
      }
    }
  }, []);

  // Save formData to localStorage on change
  useEffect(() => {
    localStorage.setItem("onboardingDraft", JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };



  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");
      const response = await fetch(`${apiBaseUrl}/api/v1/preferences`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success || result.document_id) {
        localStorage.removeItem("onboardingDraft");
        // Navigate to past reports or generate page after successful submission
        navigate("/past-reports");
      } else {
        throw new Error(result.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "demographics":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Tell us about yourself
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) =>
                    updateFormData("age", parseInt(e.target.value) || undefined)
                  }
                  className="mobile-input"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender || ""}
                  onChange={(e) => updateFormData("gender", e.target.value)}
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Marital Status
                </label>
                <select
                  value={formData.marital_status || ""}
                  onChange={(e) =>
                    updateFormData("marital_status", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="partnered">Partnered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Household Size
                </label>
                <input
                  type="number"
                  value={formData.household_size || ""}
                  onChange={(e) =>
                    updateFormData(
                      "household_size",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="mobile-input"
                  placeholder="Number of people in household"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Number of Children
                </label>
                <input
                  type="number"
                  value={formData.children_count || ""}
                  onChange={(e) =>
                    updateFormData(
                      "children_count",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="mobile-input"
                  placeholder="Number of children"
                />
              </div>

              <div className="md:col-span-2">
                <NumberTagInput
                  field="children_ages"
                  label="Children's Ages"
                  placeholder="Enter age and click + to add"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Education Level
                </label>
                <select
                  value={formData.education_level || ""}
                  onChange={(e) =>
                    updateFormData("education_level", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="high_school">High School</option>
                  <option value="some_college">Some College</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="masters">Master's Degree</option>
                  <option value="doctorate">Doctorate</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation || ""}
                  onChange={(e) => updateFormData("occupation", e.target.value)}
                  className="mobile-input"
                  placeholder="Your job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Employment Status
                </label>
                <select
                  value={formData.employment_status || ""}
                  onChange={(e) =>
                    updateFormData("employment_status", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="retired">Retired</option>
                  <option value="student">Student</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "financial":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Financial Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry || ""}
                  onChange={(e) => updateFormData("industry", e.target.value)}
                  className="mobile-input"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Income Range
                </label>
                <select
                  value={formData.income_range || ""}
                  onChange={(e) =>
                    updateFormData("income_range", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="under_30k">Under $30,000</option>
                  <option value="30k_50k">$30,000 - $50,000</option>
                  <option value="50k_75k">$50,000 - $75,000</option>
                  <option value="75k_100k">$75,000 - $100,000</option>
                  <option value="100k_150k">$100,000 - $150,000</option>
                  <option value="150k_plus">$150,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Home Price Range
                </label>
                <select
                  value={formData.preferred_home_price_range || ""}
                  onChange={(e) =>
                    updateFormData("preferred_home_price_range", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="under_200k">Under $200,000</option>
                  <option value="200k_400k">$200,000 - $400,000</option>
                  <option value="400k_600k">$400,000 - $600,000</option>
                  <option value="600k_800k">$600,000 - $800,000</option>
                  <option value="800k_1m">$800,000 - $1,000,000</option>
                  <option value="1m_plus">$1,000,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Credit Score Range
                </label>
                <select
                  value={formData.credit_score_range || ""}
                  onChange={(e) =>
                    updateFormData("credit_score_range", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="poor">Poor (300-579)</option>
                  <option value="fair">Fair (580-669)</option>
                  <option value="good">Good (670-739)</option>
                  <option value="very_good">Very Good (740-799)</option>
                  <option value="excellent">Excellent (800-850)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Savings Amount Range
                </label>
                <select
                  value={formData.savings_amount_range || ""}
                  onChange={(e) =>
                    updateFormData("savings_amount_range", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="under_10k">Under $10,000</option>
                  <option value="10k_25k">$10,000 - $25,000</option>
                  <option value="25k_50k">$25,000 - $50,000</option>
                  <option value="50k_100k">$50,000 - $100,000</option>
                  <option value="100k_plus">$100,000+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Investment Experience
                </label>
                <select
                  value={formData.investment_experience || ""}
                  onChange={(e) =>
                    updateFormData("investment_experience", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Risk Tolerance
                </label>
                <select
                  value={formData.risk_tolerance || ""}
                  onChange={(e) =>
                    updateFormData("risk_tolerance", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="very_low">Very Low</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="very_high">Very High</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "housing":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Housing Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Desired Housing Type
                </label>
                <select
                  value={formData.desired_housing_type || ""}
                  onChange={(e) =>
                    updateFormData("desired_housing_type", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="single_family">Single Family Home</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="apartment">Apartment</option>
                  <option value="duplex">Duplex</option>
                  <option value="mobile_home">Mobile Home</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Bedrooms
                </label>
                <input
                  type="number"
                  value={formData.preferred_bedrooms || ""}
                  onChange={(e) =>
                    updateFormData(
                      "preferred_bedrooms",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="mobile-input"
                  min="1"
                  max="10"
                  placeholder="Number of bedrooms"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Bathrooms
                </label>
                <input
                  type="number"
                  value={formData.preferred_bathrooms || ""}
                  onChange={(e) =>
                    updateFormData(
                      "preferred_bathrooms",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="mobile-input"
                  min="1"
                  max="10"
                  step="0.5"
                  placeholder="Number of bathrooms"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Lot Size
                </label>
                <select
                  value={formData.preferred_lot_size || ""}
                  onChange={(e) =>
                    updateFormData("preferred_lot_size", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="small">Small (under 0.25 acres)</option>
                  <option value="medium">Medium (0.25 - 0.5 acres)</option>
                  <option value="large">Large (0.5 - 1 acre)</option>
                  <option value="very_large">Very Large (1+ acres)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="preferred_home_features"
                  field="preferred_home_features"
                  label="Preferred Home Features"
                  placeholder="Enter feature and click + to add (e.g., garage, pool, fireplace)"
                />
              </div>
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Location Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <TagInput
                  key="preferred_regions"
                  field="preferred_regions"
                  label="Preferred Regions"
                  placeholder="Enter state or region and click + to add (e.g., California, Texas, Florida)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Urban/Rural Preference
                </label>
                <select
                  value={formData.urban_rural_preference || ""}
                  onChange={(e) =>
                    updateFormData("urban_rural_preference", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="urban">Urban</option>
                  <option value="suburban">Suburban</option>
                  <option value="rural">Rural</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Commute Tolerance (minutes)
                </label>
                <input
                  type="number"
                  value={formData.commute_tolerance || ""}
                  onChange={(e) =>
                    updateFormData(
                      "commute_tolerance",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  className="mobile-input"
                  min="0"
                  max="180"
                  placeholder="Maximum commute time"
                />
              </div>
            </div>
          </div>
        );

      case "lifestyle":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Lifestyle Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Lifestyle Type
                </label>
                <select
                  value={formData.lifestyle_type || ""}
                  onChange={(e) =>
                    updateFormData("lifestyle_type", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="active">Active</option>
                  <option value="quiet">Quiet</option>
                  <option value="social">Social</option>
                  <option value="family_oriented">Family Oriented</option>
                  <option value="career_focused">Career Focused</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="hobbies_interests"
                  field="hobbies_interests"
                  label="Hobbies & Interests"
                  placeholder="Enter hobby or interest and click + to add (e.g., hiking, cooking, reading)"
                />
              </div>
            </div>
          </div>
        );

      case "behavior":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Your Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Decision Making Style
                </label>
                <select
                  value={formData.decision_making_style || ""}
                  onChange={(e) =>
                    updateFormData("decision_making_style", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="analytical">Analytical</option>
                  <option value="intuitive">Intuitive</option>
                  <option value="collaborative">Collaborative</option>
                  <option value="quick">Quick</option>
                  <option value="deliberate">Deliberate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Research Behavior
                </label>
                <select
                  value={formData.research_behavior || ""}
                  onChange={(e) =>
                    updateFormData("research_behavior", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="minimal">Minimal</option>
                  <option value="moderate">Moderate</option>
                  <option value="extensive">Extensive</option>
                  <option value="obsessive">Obsessive</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "realestate":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Real Estate Goals
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Property Search Stage
                </label>
                <select
                  value={formData.property_search_stage || ""}
                  onChange={(e) =>
                    updateFormData("property_search_stage", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="not_looking">Not Looking</option>
                  <option value="browsing">Browsing</option>
                  <option value="actively_searching">Actively Searching</option>
                  <option value="ready_to_buy">Ready to Buy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Home Buying Experience
                </label>
                <select
                  value={formData.home_buying_experience || ""}
                  onChange={(e) =>
                    updateFormData("home_buying_experience", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="first_time">First Time</option>
                  <option value="experienced">Experienced</option>
                  <option value="investor">Investor</option>
                  <option value="multiple_properties">
                    Multiple Properties
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Timeline to Purchase
                </label>
                <select
                  value={formData.timeline_to_purchase || ""}
                  onChange={(e) =>
                    updateFormData("timeline_to_purchase", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="<3_months">Less than 3 months</option>
                  <option value="3-6_months">3-6 months</option>
                  <option value="6-12_months">6-12 months</option>
                  <option value=">1_year">More than 1 year</option>
                  <option value="not_sure">Not sure</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <TagInput
                  key="deal_breakers"
                  field="deal_breakers"
                  label="Deal Breakers"
                  placeholder="Add deal breakers (e.g., No parking, Busy road, Old plumbing)"
                />
              </div>
            </div>
          </div>
        );

      case "communication":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Communication Preferences
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Preferred Support Channel
                </label>
                <select
                  value={formData.preferred_support_channel || ""}
                  onChange={(e) =>
                    updateFormData("preferred_support_channel", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="chat">Chat</option>
                  <option value="self_service">Self Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Communication Frequency
                </label>
                <select
                  value={formData.communication_frequency || ""}
                  onChange={(e) =>
                    updateFormData("communication_frequency", e.target.value)
                  }
                  className="mobile-input"
                >
                  <option value="">Select...</option>
                  <option value="minimal">Minimal</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "insights":
        return (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-serif text-black mb-6">
              Personal Insights
            </h2>

            <div className="space-y-6">
              <TagInput
                key="quote_bubbles"
                field="quote_bubbles"
                label="What matters most to you in a home?"
                placeholder="Add important features (e.g., Natural light, Quiet neighborhood, Good schools)"
              />

              <TagInput
                key="deal_makers"
                field="deal_makers"
                label="What would seal the deal for you?"
                placeholder="Add deal makers (e.g., Perfect kitchen, Amazing view, Great price)"
              />

              <TagInput
                key="concerns_or_fears"
                field="concerns_or_fears"
                label="Any concerns or fears about buying?"
                placeholder="Add concerns (e.g., Hidden problems, Bad neighbors, Market crash)"
              />
            </div>
          </div>
        );

      default:
        return <div>Step content for {step.title} coming soon...</div>;
    }
  };

  // Self-contained TagInput component that manages its own state
  const TagInput = React.memo(({
    field,
    label,
    placeholder
  }: {
    field: keyof OnboardingData;
    label: string;
    placeholder: string;
  }) => {
    const [draftText, setDraftText] = React.useState('');
    const currentTags = (formData[field] as string[]) || [];

    const handleAddTag = (value: string) => {
      if (!value.trim()) return;
      const currentArray = (formData[field] as string[]) || [];
      if (!currentArray.includes(value.trim())) {
        updateFormData(field, [...currentArray, value.trim()]);
      }
      setDraftText('');
    };

    const handleRemoveTag = (valueToRemove: string) => {
      const currentArray = (formData[field] as string[]) || [];
      updateFormData(
        field,
        currentArray.filter((item) => item !== valueToRemove)
      );
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddTag(draftText);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraftText(e.target.value);
    };

    return (
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          {label}
        </label>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={draftText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="mobile-input flex-1"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => handleAddTag(draftText)}
            className="px-4 py-2 bg-brown text-white rounded-lg hover:bg-brown/80 transition-colors touch-friendly flex items-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-beige text-black"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-black/60 hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  });

  // Self-contained NumberTagInput component
  const NumberTagInput = ({
    field,
    label,
    placeholder,
  }: {
    field: keyof OnboardingData;
    label: string;
    placeholder: string;
  }) => {
    const [draftValue, setDraftValue] = useState('');
    const currentTags = (formData[field] as number[]) || [];

    const handleAddNumberTag = (value: string) => {
      const numValue = parseInt(value.trim());
      if (isNaN(numValue)) return;
      const currentArray = (formData[field] as number[]) || [];
      if (!currentArray.includes(numValue)) {
        updateFormData(field, [...currentArray, numValue]);
      }
      setDraftValue('');
    };

    const handleRemoveNumberTag = (valueToRemove: number) => {
      const currentArray = (formData[field] as number[]) || [];
      updateFormData(
        field,
        currentArray.filter((item) => item !== valueToRemove)
      );
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddNumberTag(draftValue);
      }
    };

    return (
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          {label}
        </label>
        <div className="flex space-x-2 mb-3">
          <input
            type="number"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="mobile-input flex-1"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => handleAddNumberTag(draftValue)}
            className="px-4 py-2 bg-brown text-white rounded-lg hover:bg-brown/80 transition-colors touch-friendly flex items-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-beige text-black"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveNumberTag(tag)}
                  className="ml-2 text-black/60 hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto mobile-padding">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-black mb-2">
            Welcome to SilverKey
          </h1>
          <p className="text-sm sm:text-base text-black/60">
            This information is to help our recommendation systems and for your
            agent to better help you
          </p>
          <p className="text-sm sm:text-base text-black/60">
            Feel free to skip any questions you don't want to answer, do what
            serves you
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="text-sm text-black/60">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mobile-card mb-6">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center min-w-0">
                <button
                  onClick={() => goToStep(index)}
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 transition-colors hover:scale-105 transform transition-transform ${
                    isCompleted
                      ? "bg-olive text-white hover:bg-olive/80"
                      : isActive
                      ? "bg-brown text-white hover:bg-brown/80"
                      : "bg-beige text-black/60 hover:bg-beige/80"
                  }`}
                  title={step.title}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`ml-4 w-8 sm:w-16 h-1 flex-shrink-0 ${
                      isCompleted ? "bg-olive" : "bg-beige"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mobile-card">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 mt-8 pt-6 border-t border-beige/30">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 touch-friendly ${
              currentStep === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-white border border-brown text-black hover:bg-brown hover:text-white"
            }`}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Previous
          </button>

          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-olive text-white rounded-lg hover:bg-olive/80 disabled:opacity-50 font-medium transition-all duration-200 touch-friendly"
            >
              {loading ? "Saving..." : "Complete Setup"}
              {!loading && <Check className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center justify-center px-6 py-3 bg-brown text-white rounded-lg hover:bg-brown/80 font-medium transition-all duration-200 touch-friendly"
            >
              Next
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
