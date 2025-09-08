import React, { useState, useRef } from "react";
import { FavoriteHomesDropdown, Input } from "../../components/ui";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  FileText,
  CreditCard,
  DollarSign,
  Upload,
  Download,
  CheckCircle,
  Mail,
  Heart,
  X,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { offerApi } from "../../api";
import { processImage, isValidImageFile, ProcessedImage } from "../../lib/security/imageProcessor";
import { log } from "../../lib/security/secureLogger";
import { captureError, reportSecurityEvent } from "../../lib/security/errorReporting";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const infoBox =
  "bg-olive/10 border border-olive/20 text-navy/70 text-xs p-3 rounded-lg mb-3";
const warningBox =
  "bg-amber-50/50 border border-amber-200/30 text-navy/70 text-xs p-3 rounded-lg mb-3";
const label = "block text-navy font-medium mb-2";
const textarea =
  "w-full border border-beige rounded-lg px-3 py-2 mb-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive transition-colors resize-vertical";
const fileInput =
  "block w-full text-sm text-navy file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-olive/10 file:text-olive hover:file:bg-olive/20 mb-3";
const button =
  "bg-olive text-white px-6 py-3 rounded-lg font-semibold hover:bg-olive-light transition-colors duration-200 flex items-center gap-2";

const OfferDraftPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const sectionRefs = {
    0: useRef<HTMLDivElement>(null),
    1: useRef<HTMLDivElement>(null),
    2: useRef<HTMLDivElement>(null),
    3: useRef<HTMLDivElement>(null),
  };
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

  // Define offer data type (excluding files for security)
  type OfferData = {
    price: string;
    contingencies: string;
    closingDate: string;
    earnestMoney: string;
    inclusions: string;
    exclusions: string;
    earnestMoneyAmount: string;
    escrowHolder: string;
    earnestTimeline: string;
    earnestInstructions: string;
    coverLetter: string;
  };

  // Default offer state
  const defaultOfferData: OfferData = {
    price: "",
    contingencies: "",
    closingDate: "",
    earnestMoney: "",
    inclusions: "",
    exclusions: "",
    earnestMoneyAmount: "",
    escrowHolder: "",
    earnestTimeline: "",
    earnestInstructions: "",
    coverLetter: "",
  };

  // Use centralized localStorage hooks for persistence
  const { value: offerData, setValue: setOfferData } = useLocalStorage<OfferData>('silverkey_draft_offer_data', defaultOfferData);
  
  // File state (not persisted for security reasons)
  const [fileUploads, setFileUploads] = useState({
    signedAgreement: null as File | null,
    signature: null as File | null,
    preApproval: null as File | null,
    proofOfFunds: null as File | null,
  });

  // Combined offer state for backward compatibility
  const offer = {
    ...offerData,
    ...fileUploads,
  };

  const setOffer = (updater: any) => {
    if (typeof updater === 'function') {
      const newState = updater(offer);
      // Separate text data from files
      const { signedAgreement, signature, preApproval, proofOfFunds, ...textData } = newState;
      setOfferData(textData);
      setFileUploads({ signedAgreement, signature, preApproval, proofOfFunds });
    } else {
      const { signedAgreement, signature, preApproval, proofOfFunds, ...textData } = updater;
      setOfferData(textData);
      setFileUploads({ signedAgreement, signature, preApproval, proofOfFunds });
    }
  };

  // Loading states for document generation
  const [loadingStates, setLoadingStates] = useState({
    purchaseAgreement: false,
    preApprovalLetter: false,
    earnestMoneyInstructions: false,
    coverLetter: false,
    allDocuments: false,
  });

  // Use centralized localStorage hook for selected home
  const { value: selectedHome, setValue: setSelectedHome } = useLocalStorage<any>('silverkey_draft_offer_selected_home', null);

  // Validation state for visual feedback
  const [sectionValidation, setSectionValidation] = useState<{
    [key: string]: boolean;
  }>({
    purchaseAgreement: false,
    preApproval: false,
    earnestMoney: false,
    coverLetter: false,
  });

  // Clear localStorage data (useful for cleanup)
  const clearDraftOfferData = () => {
    setOfferData(defaultOfferData);
    setSelectedHome(null);
    setFileUploads({
      signedAgreement: null,
      signature: null,
      preApproval: null,
      proofOfFunds: null,
    });
  };

  // Note: Auto-save is handled automatically by useLocalStorage hooks
  // No useEffect needed for persistence

  // Secure file handling with EXIF stripping for images
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      log.security('OFFER_DRAFT', 'File upload attempt', { 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size,
        field 
      });

      // Process images to strip EXIF data
      if (isValidImageFile(file)) {
        log.info('OFFER_DRAFT', 'Processing image file for security', { fileName: file.name });
        
        const processed: ProcessedImage = await processImage(file, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 0.9,
          stripAllMetadata: true
        });

        if (processed.warnings.length > 0) {
          log.warn('OFFER_DRAFT', 'Image processing warnings', { 
            fileName: file.name, 
            warnings: processed.warnings 
          });
        }

        log.security('OFFER_DRAFT', 'Image processed successfully', {
          originalSize: processed.originalSize,
          processedSize: processed.processedSize,
          metadataRemoved: processed.metadataRemoved
        });

        setOffer((prev: typeof offer) => ({ ...prev, [field]: processed.file }));
      } else {
        // For non-image files (PDFs), use as-is but log the upload
        log.info('OFFER_DRAFT', 'Non-image file uploaded', { 
          fileName: file.name, 
          fileType: file.type 
        });
        setOffer((prev: typeof offer) => ({ ...prev, [field]: file }));
      }

      reportSecurityEvent({
        type: 'data_access',
        severity: 'low',
        description: 'File uploaded in offer draft',
        metadata: { fileName: file.name, fileType: file.type, field }
      });

    } catch (error) {
      log.error('OFFER_DRAFT', 'File processing failed', error);
      captureError(error, { 
        context: 'handleFile', 
        fileName: file.name, 
        field 
      });
      
      // Show user-friendly error
      alert('Failed to process file. Please try again or contact support.');
    }
  };

  // Text/number/date change handler with auto-save
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    key: keyof typeof offer
  ) => {
    const newValue = e.target.value;
    setOffer((prev: typeof offer) => {
      const updated = { ...prev, [key]: newValue };
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
      const data = await offerApi.generatePurchaseAgreement({
        property_address: "123 Main St, City, State 12345", // TODO: Get from form
        offer_price: parseInt(offer.price) || 0,
        earnest_money: parseInt(offer.earnestMoney) || 0,
        closing_date: offer.closingDate,
        contingencies: offer.contingencies
          .split(",")
          .map((c: string) => c.trim())
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
      });

      if (data.success) {
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
      const data = await offerApi.generatePreApprovalLetter({
        buyer_name: "John Doe", // TODO: Get from user profile
        loan_amount: parseInt(offer.earnestMoney) || 0, // TODO: Add loan amount field
        property_address: "123 Main St, City, State 12345", // TODO: Get from form
        loan_type: "conventional", // TODO: Add loan type field
      });

      if (data.success) {
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
      const data = await offerApi.generateEarnestMoneyInstructions({
        property_address: "123 Main St, City, State 12345", // TODO: Get from form
        earnest_amount: parseInt(offer.earnestMoney) || 0,
        escrow_company: "TBD Escrow Company", // TODO: Add escrow company field
      });

      if (data.success) {
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
      const data = await offerApi.generateCoverLetter({
        property_address: "123 Main St, City, State 12345", // TODO: Get from form
        buyer_story: "This would be our first home together as newlyweds",
        offer_highlights: [
          "Strong offer price",
          "Pre-approved financing",
          "Flexible closing",
        ],
      });

      if (data.success) {
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
      <div className="px-responsive-lg py-responsive-lg">
        {/* Favorite Homes Dropdown */}
        <div className="bg-white rounded-xl shadow-sm space-responsive-md space-y-responsive-md border border-beige/40">
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

        {/* Tab Navigation */}
        <div className="bg-white border-b border-beige/40 sticky top-0 z-10 mx-2">
          <div className="mx-auto px-responsive-lg">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => scrollToSection(tab.id)}
                    className={`flex items-center gap-responsive-sm px-responsive-sm py-responsive-sm text-responsive-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 min-w-fit touch-friendly ${
                      activeTab === tab.id
                        ? "border-brown text-brown bg-brown/5"
                        : "border-transparent text-navy/70 hover:text-navy hover:border-beige"
                    }`}
                  >
                    <IconComponent className="mobile-icon-xs" />
                    <span className="hidden lg:inline">{tab.title}</span>
                    <span className="lg:hidden">{tab.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto px-responsive-lg py-responsive-lg">
          <form onSubmit={handleSubmit}>
            {/* 1. Purchase Offer / Agreement */}
            <div ref={sectionRefs[0]} className={sectionBox}>
              <div className={sectionTitle}>
                <FileText className="mobile-icon-sm text-brown" />
                Signed Purchase Offer
              </div>
              <div className={infoBox}>
                This is the formal, legally binding contract that outlines the
                exact terms of your offer to buy the property — including price,
                contingencies, closing date, earnest money, and
                included/excluded items.
                <br />
                <span className="italic">
                  Must be signed by all buyers and reviewed by your agent or a
                  real estate attorney before delivery to the seller.
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
                          You’re still negotiating basic terms verbally or
                          through email/text before formalizing in writing
                        </li>
                        <li>
                          You’re making a non-binding letter of intent first to
                          gauge seller interest
                        </li>
                        <li>
                          Your agent or attorney advises waiting until certain
                          disclosures or inspections are provided
                        </li>
                      </ul>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>
                          In most cases, sending a signed purchase offer
                          promptly gives your offer legal weight and shows
                          serious intent.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Input
                label="Offer Price ($)"
                type="number"
                min="0"
                value={offer.price}
                onChange={(e) => handleChange(e, "price")}
                placeholder="Enter your offer price"
                leftIcon={<DollarSign className="w-4 h-4" />}
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
              <Input
                label="Closing Date"
                type="date"
                value={offer.closingDate}
                onChange={(e) => handleChange(e, "closingDate")}
                required
              />
              <Input
                label="Earnest Money Amount ($)"
                type="number"
                min="0"
                value={offer.earnestMoney}
                onChange={(e) => handleChange(e, "earnestMoney")}
                leftIcon={<DollarSign className="w-4 h-4" />}
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
                <Upload className="inline mobile-icon-xs mr-1" />
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
                <Upload className="inline mobile-icon-xs mr-1" />
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
                    <div className="mobile-icon-xs animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <FileCheck className="mobile-icon-xs" />
                  )}
                  <span className="text-responsive-xs">
                    {loadingStates.purchaseAgreement
                      ? "Generating..."
                      : "Generate Agreement"}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Mortgage Pre-Approval or Proof of Funds */}
            <div ref={sectionRefs[1]} className={sectionBox}>
              <div className={sectionTitle}>
                <CreditCard className="mobile-icon-sm text-brown" />
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
                          You're making a cash offer and will send proof of
                          funds instead
                        </li>
                        <li>
                          You're waiting on pre-approval but want to signal
                          intent early
                        </li>
                        <li>
                          You're negotiating a deal off-market where financing
                          is already known to the seller (e.g., parent selling
                          to child)
                        </li>
                      </ul>
                      <div className="flex items-start gap-responsive-xs">
                        <AlertTriangle className="mobile-icon-xs text-red-500 mt-0.5 flex-shrink-0" />
                        <span>
                          If you're financing and don't send this, your offer
                          may not be taken seriously.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <label className={label}>
                <Upload className="inline mobile-icon-xs mr-1" />
                Upload Pre-Approval Letter (PDF)
              </label>
              <input
                className={fileInput}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFile(e, "preApproval")}
              />
              <label className={label}>
                <Upload className="inline mobile-icon-xs mr-1" />
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
                    <div className="mobile-icon-xs animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <FileCheck className="mobile-icon-xs" />
                  )}
                  <span className="text-responsive-xs">
                    {loadingStates.preApprovalLetter
                      ? "Generating..."
                      : "Generate Pre-Approval"}
                  </span>
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
              <Input
                label="Earnest Money Amount"
                type="text"
                value={offer.earnestMoneyAmount}
                onChange={(e) => handleChange(e, "earnestMoneyAmount")}
                placeholder="e.g., 1% of purchase price or $5,000"
                leftIcon={<DollarSign className="w-4 h-4" />}
                required
              />
              <Input
                label="Escrow Holder"
                type="text"
                value={offer.escrowHolder}
                onChange={(e) => handleChange(e, "escrowHolder")}
                placeholder="e.g., Title Company Name"
                required
              />
              <Input
                label="Timeline for Payment"
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
                    <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <FileCheck className="h-4 w-4" />
                  )}
                  <span className="text-responsive-xs">
                    {loadingStates.earnestMoneyInstructions
                      ? "Generating..."
                      : "Generate Instructions"}
                  </span>
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
                    <strong>
                      You Don't Send a Cover Letter ("Love Letter")
                    </strong>
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
                    <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <FileCheck className="h-4 w-4" />
                  )}
                  <span className="text-responsive-xs">
                    {loadingStates.coverLetter
                      ? "Generating..."
                      : "Generate Cover Letter"}
                  </span>
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
                    <div className="h-5 w-5 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <FileCheck className="h-5 w-5" />
                  )}
                  <span className="text-responsive-xs">
                    {loadingStates.allDocuments
                      ? "Generating All..."
                      : "Generate All Documents"}
                  </span>
                </button>
                <button className={button} type="submit">
                  <Download className="h-5 w-5" />
                  <span className="text-responsive-xs">
                    Download All Documents
                  </span>
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
                  <span className="text-responsive-xs">Clear Draft</span>
                </button>
                <button
                  type="button"
                  className="bg-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy/90 transition-colors duration-200 flex items-center gap-2"
                  onClick={() => alert("Email All Documents functionality")}
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-responsive-xs">
                    Email All Documents
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfferDraftPage;
