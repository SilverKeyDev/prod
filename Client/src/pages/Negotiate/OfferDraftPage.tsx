import React, { useState, useRef, useEffect } from "react";
import MiniLogo from "../../components/MiniLogo";
import FavoriteHomesDropdown from "../../components/FavoriteHomesDropdown";
import {
  FileText,
  CreditCard,
  DollarSign,
  Heart,
  Upload,
  AlertTriangle,
  CheckCircle,
  X,
  Download,
  Mail,
  FileCheck,
  Loader2,
} from "lucide-react";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const infoBox =
  "bg-olive/10 border border-olive/20 text-navy/70 text-xs p-3 rounded-lg mb-3";
const warningBox =
  "bg-amber-50/50 border border-amber-200/30 text-navy/70 text-xs p-3 rounded-lg mb-3";
const label = "block text-navy font-medium mb-2";
const input =
  "w-full border border-beige rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive transition-colors";
const textarea =
  "w-full border border-beige rounded-lg px-3 py-2 mb-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive transition-colors resize-vertical";
const fileInput =
  "block w-full text-sm text-navy file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-olive/10 file:text-olive hover:file:bg-olive/20 mb-3";
const button =
  "bg-olive text-white px-6 py-3 rounded-lg font-semibold hover:bg-olive-light transition-colors duration-200 flex items-center gap-2";

const OfferDraftPage: React.FC = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Refs for scrolling to sections
  const sectionRefs = {
    0: useRef<HTMLDivElement>(null),
    1: useRef<HTMLDivElement>(null),
    2: useRef<HTMLDivElement>(null),
    3: useRef<HTMLDivElement>(null),
  };

  // Tab configuration
  const tabs = [
    {
      id: 0,
      title: "Signed Purchase Offer",
      icon: FileText,
      shortTitle: "Purchase Agreement",
    },
    {
      id: 1,
      title: "Mortgage Pre-Approval/ Proof of Funds",
      icon: CreditCard,
      shortTitle: "Mortgage Pre-Approval / Proof of Funds",
    },
    {
      id: 2,
      title: "Earnest Money Instructions",
      icon: DollarSign,
      shortTitle: "Earnest Money",
    },
    {
      id: 3,
      title: "Buyer Cover Letter (Optional)",
      icon: Heart,
      shortTitle: "Cover Letter",
    },
  ];

  // Function to scroll to section and set active tab
  const scrollToSection = (tabId: number) => {
    setActiveTab(tabId);
    const sectionRef = sectionRefs[tabId as keyof typeof sectionRefs];
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  // localStorage key for draft offer data
  const DRAFT_OFFER_STORAGE_KEY = "silverkey_draft_offer_data";

  // Initialize state from localStorage or defaults
  const initializeOfferState = () => {
    try {
      const savedData = localStorage.getItem(DRAFT_OFFER_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Only restore text fields, not file uploads for security reasons
        return {
          price: parsed.price || "",
          contingencies: parsed.contingencies || "",
          closingDate: parsed.closingDate || "",
          earnestMoney: parsed.earnestMoney || "",
          inclusions: parsed.inclusions || "",
          exclusions: parsed.exclusions || "",
          signedAgreement: null as File | null, // Don't restore files
          signature: null as File | null,
          preApproval: null as File | null,
          earnestMoneyAmount: parsed.earnestMoneyAmount || "",
          escrowHolder: parsed.escrowHolder || "",
          earnestTimeline: parsed.earnestTimeline || "",
          earnestInstructions: parsed.earnestInstructions || "",
          proofOfFunds: null as File | null, // Don't restore files
          coverLetter: parsed.coverLetter || "",
        };
      }
    } catch (error) {
      console.warn("Failed to load draft offer data from localStorage:", error);
    }

    // Return default state if localStorage is empty or failed
    return {
      price: "",
      contingencies: "",
      closingDate: "",
      earnestMoney: "",
      inclusions: "",
      exclusions: "",
      signedAgreement: null as File | null,
      signature: null as File | null,
      preApproval: null as File | null,
      earnestMoneyAmount: "",
      escrowHolder: "",
      earnestTimeline: "",
      earnestInstructions: "",
      proofOfFunds: null as File | null,
      coverLetter: "",
    };
  };

  // State for all form fields with localStorage initialization
  const [offer, setOffer] = useState(initializeOfferState);

  // Loading states for document generation
  const [loadingStates, setLoadingStates] = useState({
    purchaseAgreement: false,
    preApprovalLetter: false,
    earnestMoneyInstructions: false,
    coverLetter: false,
    allDocuments: false,
  });

  // Generated documents state
  const [, setGeneratedDocuments] = useState({
    purchaseAgreement: null as any,
    preApprovalLetter: null as any,
    earnestMoneyInstructions: null as any,
    coverLetter: null as any,
  });

  // Initialize selected home from localStorage
  const initializeSelectedHome = () => {
    try {
      const savedHome = localStorage.getItem(
        "silverkey_draft_offer_selected_home"
      );
      return savedHome ? JSON.parse(savedHome) : null;
    } catch (error) {
      console.warn("Failed to load selected home from localStorage:", error);
      return null;
    }
  };

  // Selected home state
  const [selectedHome, setSelectedHome] = useState<any>(initializeSelectedHome);

  // Validation state for visual feedback
  const [sectionValidation, setSectionValidation] = useState<{
    [key: string]: boolean;
  }>({
    purchaseAgreement: false,
    preApproval: false,
    earnestMoney: false,
    coverLetter: false,
  });

  // Save offer data to localStorage (excluding files for security)
  const saveToLocalStorage = (offerData: typeof offer) => {
    try {
      const dataToSave = {
        price: offerData.price,
        contingencies: offerData.contingencies,
        closingDate: offerData.closingDate,
        earnestMoney: offerData.earnestMoney,
        inclusions: offerData.inclusions,
        exclusions: offerData.exclusions,
        earnestMoneyAmount: offerData.earnestMoneyAmount,
        escrowHolder: offerData.escrowHolder,
        earnestTimeline: offerData.earnestTimeline,
        earnestInstructions: offerData.earnestInstructions,
        coverLetter: offerData.coverLetter,
        // Note: File uploads are not saved for security reasons
      };
      localStorage.setItem(DRAFT_OFFER_STORAGE_KEY, JSON.stringify(dataToSave));
      console.log("📝 Draft offer data saved to localStorage");
    } catch (error) {
      console.error("Failed to save draft offer data to localStorage:", error);
    }
  };

  // Save selected home to localStorage
  const saveSelectedHomeToLocalStorage = (home: any) => {
    try {
      localStorage.setItem(
        "silverkey_draft_offer_selected_home",
        JSON.stringify(home)
      );
      console.log("🏠 Selected home saved to localStorage");
    } catch (error) {
      console.error("Failed to save selected home to localStorage:", error);
    }
  };

  // Clear localStorage data (useful for cleanup)
  const clearDraftOfferData = () => {
    try {
      localStorage.removeItem(DRAFT_OFFER_STORAGE_KEY);
      localStorage.removeItem("silverkey_draft_offer_selected_home");
      console.log("🗑️ Draft offer data cleared from localStorage");
    } catch (error) {
      console.error(
        "Failed to clear draft offer data from localStorage:",
        error
      );
    }
  };

  // Auto-save effect - runs whenever offer state changes
  useEffect(() => {
    saveToLocalStorage(offer);
  }, [offer]);

  // Auto-save selected home whenever it changes
  useEffect(() => {
    if (selectedHome) {
      saveSelectedHomeToLocalStorage(selectedHome);
    }
  }, [selectedHome]);

  // File change handler (files are not saved to localStorage for security)
  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof offer
  ) => {
    if (e.target.files && e.target.files[0]) {
      setOffer((prev) => ({ ...prev, [key]: e.target.files![0] }));
      // Note: Files are not saved to localStorage for security reasons
      console.log(`📎 File uploaded for ${key}:`, e.target.files[0].name);
      // Update validation state when form changes
      setTimeout(updateSectionValidation, 100);
    }
  };

  // Text/number/date change handler with auto-save
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    key: keyof typeof offer
  ) => {
    const newValue = e.target.value;
    setOffer((prev) => {
      const updated = { ...prev, [key]: newValue };
      // Auto-save will be triggered by useEffect
      return updated;
    });
    // Update validation state when form changes
    setTimeout(updateSectionValidation, 100);
  };

  // Handle home selection with auto-save
  const handleHomeSelection = (home: any) => {
    setSelectedHome(home);
    // Auto-save will be triggered by useEffect
    // Update validation state when home selection changes
    setTimeout(updateSectionValidation, 100);
  };

  // Validation functions for each section
  const validatePurchaseAgreementSection = (): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (!selectedHome)
      errors.push(
        "Please select a property from your favorites before generating documents"
      );
    if (!offer.price || parseFloat(offer.price) <= 0)
      errors.push("Offer price is required and must be greater than 0");
    if (!offer.contingencies.trim()) errors.push("Contingencies are required");
    if (!offer.closingDate) errors.push("Closing date is required");
    if (!offer.earnestMoney || parseFloat(offer.earnestMoney) <= 0)
      errors.push(
        "Earnest money amount is required and must be greater than 0"
      );
    if (!offer.signedAgreement)
      errors.push("Signed agreement document is required");

    return { isValid: errors.length === 0, errors };
  };

  const validatePreApprovalSection = (): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Property address is required for all document generation
    if (!selectedHome)
      errors.push(
        "Please select a property from your favorites before generating documents"
      );

    // At least one document is required (pre-approval OR proof of funds)
    if (!offer.preApproval && !offer.proofOfFunds) {
      errors.push(
        "Either a pre-approval letter or proof of funds document is required"
      );
    }

    return { isValid: errors.length === 0, errors };
  };

  const validateEarnestMoneySection = (): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Property address is required for all document generation
    if (!selectedHome)
      errors.push(
        "Please select a property from your favorites before generating documents"
      );

    if (
      !offer.earnestMoneyAmount ||
      parseFloat(offer.earnestMoneyAmount) <= 0
    ) {
      errors.push(
        "Earnest money amount is required and must be greater than 0"
      );
    }
    if (!offer.escrowHolder.trim())
      errors.push("Escrow holder information is required");
    if (!offer.earnestTimeline.trim())
      errors.push("Payment timeline is required");

    return { isValid: errors.length === 0, errors };
  };

  const validateCoverLetterSection = (): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Property address is required for all document generation
    if (!selectedHome)
      errors.push(
        "Please select a property from your favorites before generating documents"
      );

    // Cover letter content is required if generating this section
    if (!offer.coverLetter.trim()) {
      errors.push("Cover letter content is required");
    }

    return { isValid: errors.length === 0, errors };
  };

  // Validate all sections for "Generate All" functionality
  const validateAllSections = (): { isValid: boolean; errors: string[] } => {
    const allErrors: string[] = [];

    const purchaseValidation = validatePurchaseAgreementSection();
    const preApprovalValidation = validatePreApprovalSection();
    const earnestMoneyValidation = validateEarnestMoneySection();
    // Note: Cover letter is optional, so we don't validate it for "Generate All"

    if (!purchaseValidation.isValid) {
      allErrors.push(
        "Purchase Agreement section:",
        ...purchaseValidation.errors.map((e) => `  • ${e}`)
      );
    }
    if (!preApprovalValidation.isValid) {
      allErrors.push(
        "Pre-Approval section:",
        ...preApprovalValidation.errors.map((e) => `  • ${e}`)
      );
    }
    if (!earnestMoneyValidation.isValid) {
      allErrors.push(
        "Earnest Money section:",
        ...earnestMoneyValidation.errors.map((e) => `  • ${e}`)
      );
    }

    return { isValid: allErrors.length === 0, errors: allErrors };
  };

  // Show validation errors as alert and update validation state
  const showValidationErrors = (errors: string[], sectionKey: string) => {
    const errorMessage =
      "Please fix the following errors:\n\n" + errors.join("\n");
    alert(errorMessage);

    // Update validation state for visual feedback
    setSectionValidation((prev) => ({ ...prev, [sectionKey]: false }));
  };

  // Update validation state when sections become valid
  const updateSectionValidation = () => {
    setSectionValidation({
      purchaseAgreement: validatePurchaseAgreementSection().isValid,
      preApproval: validatePreApprovalSection().isValid,
      earnestMoney: validateEarnestMoneySection().isValid,
      coverLetter: validateCoverLetterSection().isValid,
    });
  };

  // API helper function to get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token") || "";
  };

  // API function to generate purchase agreement
  const generatePurchaseAgreement = async () => {
    // Validate section before generating
    const validation = validatePurchaseAgreementSection();
    if (!validation.isValid) {
      showValidationErrors(validation.errors, "purchaseAgreement");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, purchaseAgreement: true }));

    try {
      const response = await fetch("/api/v1/offer/purchase-agreement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          property_address: "123 Main St, City, State 12345", // TODO: Get from form
          offer_price: parseInt(offer.price) || 0,
          earnest_money: parseInt(offer.earnestMoney) || 0,
          closing_date: offer.closingDate,
          contingencies: offer.contingencies
            .split(",")
            .map((c: string) => c.trim())
            .filter(Boolean),
          inclusions: offer.inclusions
            .split(",")
            .map((i: string) => i.trim())
            .filter(Boolean),
          exclusions: offer.exclusions
            .split(",")
            .map((e: string) => e.trim())
            .filter(Boolean),
          buyer_info: {
            name: "John Doe", // TODO: Get from user profile
            email: "john@example.com", // TODO: Get from user profile
            phone: "555-0123", // TODO: Get from user profile
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedDocuments((prev) => ({ ...prev, purchaseAgreement: data }));
        alert(
          `Purchase Agreement generated successfully! Document ID: ${data.document_id}`
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating purchase agreement:", error);
      alert("Failed to generate purchase agreement. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, purchaseAgreement: false }));
    }
  };

  // API function to generate pre-approval letter
  const generatePreApprovalLetter = async () => {
    // Validate section before generating
    const validation = validatePreApprovalSection();
    if (!validation.isValid) {
      showValidationErrors(validation.errors, "preApproval");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, preApprovalLetter: true }));

    try {
      const response = await fetch("/api/v1/offer/pre-approval-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          document_type: "pre_approval",
          loan_amount: parseInt(offer.price) * 0.8 || 0, // Assume 20% down payment
          loan_type: "conventional",
          interest_rate: 6.5,
          lender_info: {
            name: "ABC Mortgage Company",
            loan_officer: "Jane Smith",
            phone: "555-0456",
            email: "jane@abcmortgage.com",
          },
          buyer_info: {
            name: "John Doe", // TODO: Get from user profile
            income: 80000, // TODO: Get from form
            credit_score: 750, // TODO: Get from form
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedDocuments((prev) => ({ ...prev, preApprovalLetter: data }));
        alert(
          `Pre-Approval Letter generated successfully! Document ID: ${data.document_id}`
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating pre-approval letter:", error);
      alert("Failed to generate pre-approval letter. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, preApprovalLetter: false }));
    }
  };

  // API function to generate earnest money instructions
  const generateEarnestMoneyInstructions = async () => {
    // Validate section before generating
    const validation = validateEarnestMoneySection();
    if (!validation.isValid) {
      showValidationErrors(validation.errors, "earnestMoney");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, earnestMoneyInstructions: true }));

    try {
      const response = await fetch("/api/v1/offer/earnest-money-instructions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          earnest_money_amount:
            parseInt(offer.earnestMoneyAmount) ||
            parseInt(offer.earnestMoney) ||
            0,
          escrow_holder: {
            company_name: offer.escrowHolder || "ABC Title Company",
            contact_person: "Sarah Johnson",
            phone: "555-0789",
            email: "sarah@abctitle.com",
            address: "456 Title St, City, State 12345",
          },
          deposit_timeline: offer.earnestTimeline || "within 3 business days",
          property_address: "123 Main St, City, State 12345", // TODO: Get from form
          buyer_info: {
            name: "John Doe", // TODO: Get from user profile
            phone: "555-0123",
            email: "john@example.com",
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedDocuments((prev) => ({
          ...prev,
          earnestMoneyInstructions: data,
        }));
        alert(
          `Earnest Money Instructions generated successfully! Document ID: ${data.document_id}`
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating earnest money instructions:", error);
      alert("Failed to generate earnest money instructions. Please try again.");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        earnestMoneyInstructions: false,
      }));
    }
  };

  // API function to generate cover letter
  const generateCoverLetter = async () => {
    // Validate section before generating
    const validation = validateCoverLetterSection();
    if (!validation.isValid) {
      showValidationErrors(validation.errors, "coverLetter");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, coverLetter: true }));

    try {
      const response = await fetch("/api/v1/offer/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          property_address: "123 Main St, City, State 12345", // TODO: Get from form
          seller_name: "Jane Smith", // TODO: Get from form
          buyer_info: {
            name: "John Doe", // TODO: Get from user profile
            family_size: 2,
            occupation: "Software Engineer",
            why_this_home:
              offer.coverLetter ||
              "We love the neighborhood and the beautiful garden",
            personal_story:
              "This would be our first home together as newlyweds",
          },
          offer_highlights: {
            offer_price: parseInt(offer.price) || 0,
            down_payment_percent: 20,
            closing_flexibility: true,
            pre_approved: true,
          },
          tone: "warm",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedDocuments((prev) => ({ ...prev, coverLetter: data }));
        alert(
          `Cover Letter generated successfully! Document ID: ${data.document_id}`
        );
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, coverLetter: false }));
    }
  };

  // Function to generate all documents
  const generateAllDocuments = async () => {
    // Validate all required sections before generating
    const validation = validateAllSections();
    if (!validation.isValid) {
      showValidationErrors(validation.errors, "allSections");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, allDocuments: true }));

    try {
      await Promise.all([
        generatePurchaseAgreement(),
        generatePreApprovalLetter(),
        generateEarnestMoneyInstructions(),
        generateCoverLetter(),
      ]);
      alert("All documents generated successfully!");
    } catch (error) {
      console.error("Error generating all documents:", error);
      alert(
        "Some documents failed to generate. Please check individual sections."
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, allDocuments: false }));
    }
  };

  // Placeholder submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Download or submission logic goes here!");
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4">
        <div className="mx-auto px-12 py-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
            <MiniLogo size="lg" />
              <div>
                <h1 className="text-2xl font-bold text-navy">
                  Draft Your Purchase Offer
                </h1>
                <p className="text-navy/70">
                  Prepare your offer package to purchase a home
                </p>
              </div>
            </div>

            {/* Favorite Homes Dropdown */}
            <div className="flex justify-center w-full">
              <div className="w-3/4">
                <FavoriteHomesDropdown
                  selectedHome={selectedHome}
                  onHomeSelect={handleHomeSelection}
                  placeholder="Select a favorite home"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-beige/40 sticky top-0 z-10 mx-2">
        <div className="mx-auto px-12">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToSection(tab.id)}
                  className={`flex items-center gap-3 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 min-w-fit ${
                    activeTab === tab.id
                      ? "border-brown text-brown bg-brown/5"
                      : "border-transparent text-navy/70 hover:text-navy hover:border-beige"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden lg:inline">{tab.title}</span>
                  <span className="lg:hidden">{tab.shortTitle}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-12 py-10">
        <form onSubmit={handleSubmit}>
          {/* 1. Purchase Offer / Agreement */}
          <div ref={sectionRefs[0]} className={sectionBox}>
            <div className={sectionTitle}>
              <FileText className="h-5 w-5 text-brown" />
              Signed Purchase Offer
            </div>
            <div className={infoBox}>
              This is the formal, legally binding contract that outlines the exact terms of your offer to buy the property — 
              including price, contingencies, closing date, earnest money, and included/excluded items.  
              <br />
              <span className="italic">
                Must be signed by all buyers and reviewed by your agent or a real estate attorney before delivery to the seller.
              </span>
            </div>
            <div className={warningBox}>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>You Don’t Send a Signed Purchase Offer</strong>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-olive" />
                      <span className="font-medium">Only if:</span>
                    </div>
                    <ul className="list-disc pl-6 mb-2 space-y-1">
                      <li>
                        You’re still negotiating basic terms verbally or through email/text before formalizing in writing
                      </li>
                      <li>
                        You’re making a non-binding letter of intent first to gauge seller interest
                      </li>
                      <li>
                        Your agent or attorney advises waiting until certain disclosures or inspections are provided
                      </li>
                    </ul>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>
                        In most cases, sending a signed purchase offer promptly gives your offer legal weight and shows serious intent.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <label className={label}>Offer Price ($)</label>
            <input
              className={input}
              type="number"
              min="0"
              value={offer.price}
              onChange={(e) => handleChange(e, "price")}
              placeholder="Enter your offer price"
              required
            />
            <label className={label}>Contingencies</label>
            <textarea
              className={textarea}
              value={offer.contingencies}
              onChange={(e) => handleChange(e, "contingencies")}
              placeholder="e.g., Financing, Inspection, Appraisal"
              required
            />
            <label className={label}>Closing Date</label>
            <input
              className={input}
              type="date"
              value={offer.closingDate}
              onChange={(e) => handleChange(e, "closingDate")}
              required
            />
            <label className={label}>Earnest Money Amount ($)</label>
            <input
              className={input}
              type="number"
              min="0"
              value={offer.earnestMoney}
              onChange={(e) => handleChange(e, "earnestMoney")}
              placeholder="e.g., 5000"
              required
            />
            <label className={label}>What's Included</label>
            <textarea
              className={textarea}
              value={offer.inclusions}
              onChange={(e) => handleChange(e, "inclusions")}
              placeholder="e.g., Appliances, Window Treatments"
            />
            <label className={label}>What's Excluded</label>
            <textarea
              className={textarea}
              value={offer.exclusions}
              onChange={(e) => handleChange(e, "exclusions")}
              placeholder="e.g., Seller's personal property"
            />
            <label className={label}>
              <Upload className="inline h-4 w-4 mr-1" />
              Upload Signed Agreement (PDF)
            </label>
            <input
              className={fileInput}
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFile(e, "signedAgreement")}
              required
            />
            <label className={label}>
              <Upload className="inline h-4 w-4 mr-1" />
              Upload Signature(s) (if separate)
            </label>
            <input
              className={fileInput}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFile(e, "signature")}
            />

            {/* Section Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-beige/30">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                  !sectionValidation.purchaseAgreement
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-brown text-white hover:bg-brown/90"
                }`}
                onClick={generatePurchaseAgreement}
                disabled={
                  loadingStates.purchaseAgreement ||
                  !sectionValidation.purchaseAgreement
                }
              >
                {loadingStates.purchaseAgreement ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4" />
                )}
                {loadingStates.purchaseAgreement
                  ? "Generating..."
                  : "Generate Agreement"}
              </button>
            </div>
          </div>

          {/* 2. Mortgage Pre-Approval or Proof of Funds */}
          <div ref={sectionRefs[1]} className={sectionBox}>
            <div className={sectionTitle}>
              <CreditCard className="h-5 w-5 text-brown" />
              Mortgage Pre-Approval / Proof of Funds
            </div>
            <div className={infoBox}>
              Must be a formal letter from your lender (not just
              pre-qualification).
              <br />
              <span className="italic">
                If paying cash, upload a recent bank statement with account
                number redacted.
              </span>
            </div>
            <div className={warningBox}>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>You Don't Send a Pre-Approval</strong>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-olive" />
                      <span className="font-medium">Only if:</span>
                    </div>
                    <ul className="list-disc pl-6 mb-2 space-y-1">
                      <li>
                        You're making a cash offer and will send proof of funds
                        instead
                      </li>
                      <li>
                        You're waiting on pre-approval but want to signal intent
                        early
                      </li>
                      <li>
                        You're negotiating a deal off-market where financing is
                        already known to the seller (e.g., parent selling to
                        child)
                      </li>
                    </ul>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>
                        If you're financing and don't send this, your offer may
                        not be taken seriously.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <label className={label}>
              <Upload className="inline h-4 w-4 mr-1" />
              Upload Pre-Approval Letter (PDF)
            </label>
            <input
              className={fileInput}
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFile(e, "preApproval")}
            />
            <label className={label}>
              <Upload className="inline h-4 w-4 mr-1" />
              Or Upload Proof of Funds (PDF or Image)
            </label>
            <input
              className={fileInput}
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => handleFile(e, "proofOfFunds")}
            />

            {/* Section Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-beige/30">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                  !sectionValidation.preApproval
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-brown text-white hover:bg-brown/90"
                }`}
                onClick={generatePreApprovalLetter}
                disabled={
                  loadingStates.preApprovalLetter ||
                  !sectionValidation.preApproval
                }
              >
                {loadingStates.preApprovalLetter ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4" />
                )}
                {loadingStates.preApprovalLetter
                  ? "Generating..."
                  : "Generate Pre-Approval"}
              </button>
            </div>
          </div>

          {/* 3. Earnest Money Instructions */}
          <div ref={sectionRefs[2]} className={sectionBox}>
            <div className={sectionTitle}>
              <DollarSign className="h-5 w-5 text-brown" />
              Earnest Money Instructions
            </div>
            <div className={infoBox}>
              You don’t send the money yet. Explain how much you’re putting
              down, who will hold it in escrow, and the timeline for payment
              (e.g., within 3 business days of acceptance).
            </div>
            <div className={warningBox}>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>You Don't Send Earnest Money Info</strong>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-olive" />
                      <span className="font-medium">Only if:</span>
                    </div>
                    <ul className="list-disc pl-6 mb-2 space-y-1">
                      <li>
                        You're waiting to agree on terms first before putting
                        money at risk
                      </li>
                      <li>
                        You're in a hot market and want to speed up the offer,
                        with the understanding that earnest money will come
                        after acceptance
                      </li>
                      <li>
                        Seller hasn't specified where it should be held
                        (escrow/title)
                      </li>
                    </ul>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-olive mt-0.5 flex-shrink-0" />
                      <span>
                        You should still mention your intent to send earnest
                        money upon acceptance.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <label className={label}>Earnest Money Amount</label>
            <input
              className={input}
              type="text"
              value={offer.earnestMoneyAmount}
              onChange={(e) => handleChange(e, "earnestMoneyAmount")}
              placeholder="e.g., 1% of purchase price or $5,000"
              required
            />
            <label className={label}>Escrow Holder</label>
            <input
              className={input}
              type="text"
              value={offer.escrowHolder}
              onChange={(e) => handleChange(e, "escrowHolder")}
              placeholder="e.g., Title Company Name"
              required
            />
            <label className={label}>Timeline for Payment</label>
            <input
              className={input}
              type="text"
              value={offer.earnestTimeline}
              onChange={(e) => handleChange(e, "earnestTimeline")}
              placeholder="e.g., Within 3 business days of acceptance"
              required
            />
            <label className={label}>
              Additional Earnest Money Instructions (optional)
            </label>
            <textarea
              className={textarea}
              value={offer.earnestInstructions}
              onChange={(e) => handleChange(e, "earnestInstructions")}
              placeholder="Any special instructions or notes"
            />

            {/* Section Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-beige/30">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                  !sectionValidation.earnestMoney
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-brown text-white hover:bg-brown/90"
                }`}
                onClick={generateEarnestMoneyInstructions}
                disabled={
                  loadingStates.earnestMoneyInstructions ||
                  !sectionValidation.earnestMoney
                }
              >
                {loadingStates.earnestMoneyInstructions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4" />
                )}
                {loadingStates.earnestMoneyInstructions
                  ? "Generating..."
                  : "Generate Instructions"}
              </button>
            </div>
          </div>

          {/* 4. (Optional) Buyer Cover Letter */}
          <div ref={sectionRefs[3]} className={sectionBox}>
            <div className={sectionTitle}>
              <Heart className="h-5 w-5 text-brown" />
              Buyer Cover Letter (Optional)
            </div>
            <div className={infoBox}>
              Write a short, authentic note about why you love the home and
              neighborhood. <br />
              <span className="italic">
                Do not include any information about protected classes (Fair
                Housing compliance).
              </span>
            </div>
            <div className={warningBox}>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>You Don't Send a Cover Letter ("Love Letter")</strong>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-olive" />
                      <span className="font-medium">Usually skipped if:</span>
                    </div>
                    <ul className="list-disc pl-6 mb-2 space-y-1">
                      <li>
                        The seller's agent explicitly forbids it due to Fair
                        Housing laws
                      </li>
                      <li>
                        It's a highly competitive market where letters are
                        discouraged
                      </li>
                      <li>You prefer to keep things strictly professional</li>
                    </ul>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>
                        These are always optional, and in some states,
                        discouraged or banned for ethical reasons.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <label className={label}>Your Letter</label>
            <textarea
              className={textarea}
              value={offer.coverLetter}
              onChange={(e) => handleChange(e, "coverLetter")}
              placeholder="Share your story (optional)"
            />

            {/* Section Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-beige/30">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                  !sectionValidation.coverLetter
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-brown text-white hover:bg-brown/90"
                }`}
                onClick={generateCoverLetter}
                disabled={
                  loadingStates.coverLetter || !sectionValidation.coverLetter
                }
              >
                {loadingStates.coverLetter ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4" />
                )}
                {loadingStates.coverLetter
                  ? "Generating..."
                  : "Generate Cover Letter"}
              </button>
            </div>
          </div>

          {/* Overall Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-8 border border-beige/40">
            <h3 className="text-lg font-semibold text-navy mb-4">
              Complete Offer Package
            </h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                type="button"
                className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 ${
                  !validateAllSections().isValid
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-brown text-white hover:bg-brown/90"
                }`}
                onClick={generateAllDocuments}
                disabled={
                  loadingStates.allDocuments || !validateAllSections().isValid
                }
              >
                {loadingStates.allDocuments ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileCheck className="h-5 w-5" />
                )}
                {loadingStates.allDocuments
                  ? "Generating All..."
                  : "Generate All Documents"}
              </button>
              <button className={button} type="submit">
                <Download className="h-5 w-5" />
                Download All Documents
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear all draft data? This cannot be undone."
                    )
                  ) {
                    clearDraftOfferData();
                    // Reset form state
                    setOffer({
                      price: "",
                      contingencies: "",
                      closingDate: "",
                      earnestMoney: "",
                      inclusions: "",
                      exclusions: "",
                      signedAgreement: null,
                      signature: null,
                      preApproval: null,
                      earnestMoneyAmount: "",
                      escrowHolder: "",
                      earnestTimeline: "",
                      earnestInstructions: "",
                      proofOfFunds: null,
                      coverLetter: "",
                    });
                    setSelectedHome(null);
                    alert("Draft data cleared successfully!");
                  }
                }}
              >
                <X className="h-4 w-4" />
                Clear Draft
              </button>
              <button
                type="button"
                className="bg-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy/90 transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Email All Documents functionality")}
              >
                <Mail className="h-5 w-5" />
                Email All Documents
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferDraftPage;
