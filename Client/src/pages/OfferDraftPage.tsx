import React, { useState, useRef } from "react";
import KeyLogo from "../components/KeyLogo";
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
} from "lucide-react";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const infoBox =
  "bg-olive/20 border-l-4 border-olive text-navy text-sm p-4 rounded-r mb-4";
const warningBox =
  "bg-yellow-50 border-l-4 border-yellow-200 text-navy text-sm p-4 rounded-r mb-4";
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
      shortTitle: "Purchase Agreement"
    },
    {
      id: 1,
      title: "Mortgage Pre-Approval/ Proof of Funds",
      icon: CreditCard,
      shortTitle: "Mortgage Pre-Approval / Proof of Funds"
    },
    {
      id: 2,
      title: "Earnest Money Instructions",
      icon: DollarSign,
      shortTitle: "Earnest Money"
    },
    {
      id: 3,
      title: "Buyer Cover Letter (Optional)",
      icon: Heart,
      shortTitle: "Cover Letter"
    }
  ];

  // Function to scroll to section and set active tab
  const scrollToSection = (tabId: number) => {
    setActiveTab(tabId);
    const sectionRef = sectionRefs[tabId as keyof typeof sectionRefs];
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // State for all form fields (simplified for now)
  const [offer, setOffer] = useState({
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
  });

  // File change handler
  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof offer
  ) => {
    if (e.target.files && e.target.files[0]) {
      setOffer((prev) => ({ ...prev, [key]: e.target.files![0] }));
    }
  };

  // Text/number/date change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    key: keyof typeof offer
  ) => {
    setOffer((prev) => ({ ...prev, [key]: e.target.value }));
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
          <div className="flex items-center gap-4 mb-4">
            <KeyLogo size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-navy">
                Draft Your Purchase Offer
              </h1>
              <p className="text-navy/70">
                Prepare your offer package to purchase a home
              </p>
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
                      ? 'border-brown text-brown bg-brown/5'
                      : 'border-transparent text-navy/70 hover:text-navy hover:border-beige'
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
              This is a legal contract. Use a state-specific template and have
              it reviewed by a real estate attorney.
              <br />
              <span className="italic">
                Must be signed and dated by all buyers.
              </span>
            </div>
            <div className={warningBox}>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>You Don't Send the Purchase Agreement</strong>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-olive" />
                      <span className="font-medium">Only if:</span>
                    </div>
                    <ul className="list-disc pl-6 mb-2 space-y-1">
                      <li>
                        You're not ready to make an official offer yet and are
                        just expressing interest or starting a conversation
                      </li>
                      <li>
                        You're still clarifying disclosures, HOA details, or
                        title issues before committing
                      </li>
                      <li>
                        You want the seller to send their preferred contract
                        first (more common in FSBO deals or off-market sales)
                      </li>
                    </ul>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="italic">
                        "We're interested and pre-approved, but would like to
                        review the HOA/tax documents before submitting a formal
                        offer."
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
                className="bg-brown text-white px-4 py-2 rounded-lg font-medium hover:bg-brown/90 transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Generate Purchase Agreement functionality")}
              >
                <FileCheck className="h-4 w-4" />
                Generate Agreement
              </button>
              <button
                type="button"
                className="bg-olive text-white px-4 py-2 rounded-lg font-medium hover:bg-olive-light transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Download Purchase Agreement functionality")}
              >
                <Download className="h-4 w-4" />
                Download Agreement
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
                className="bg-brown text-white px-4 py-2 rounded-lg font-medium hover:bg-brown/90 transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Generate Pre-Approval Letter functionality")}
              >
                <FileCheck className="h-4 w-4" />
                Generate Pre-Approval
              </button>
              <button
                type="button"
                className="bg-olive text-white px-4 py-2 rounded-lg font-medium hover:bg-olive-light transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Download Pre-Approval Letter functionality")}
              >
                <Download className="h-4 w-4" />
                Download Pre-Approval
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
                className="bg-brown text-white px-4 py-2 rounded-lg font-medium hover:bg-brown/90 transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Generate Earnest Money Instructions functionality")}
              >
                <FileCheck className="h-4 w-4" />
                Generate Instructions
              </button>
              <button
                type="button"
                className="bg-olive text-white px-4 py-2 rounded-lg font-medium hover:bg-olive-light transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Download Earnest Money Instructions functionality")}
              >
                <Download className="h-4 w-4" />
                Download Instructions
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
                className="bg-brown text-white px-4 py-2 rounded-lg font-medium hover:bg-brown/90 transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Generate Cover Letter functionality")}
              >
                <FileCheck className="h-4 w-4" />
                Generate Cover Letter
              </button>
              <button
                type="button"
                className="bg-olive text-white px-4 py-2 rounded-lg font-medium hover:bg-olive-light transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Download Cover Letter functionality")}
              >
                <Download className="h-4 w-4" />
                Download Cover Letter
              </button>
            </div>
          </div>

          {/* Overall Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-8 border border-beige/40">
            <h3 className="text-lg font-semibold text-navy mb-4">Complete Offer Package</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                type="button"
                className="bg-brown text-white px-6 py-3 rounded-lg font-semibold hover:bg-brown/90 transition-colors duration-200 flex items-center gap-2"
                onClick={() => alert("Generate All Documents functionality")}
              >
                <FileCheck className="h-5 w-5" />
                Generate All Documents
              </button>
              <button
                className={button}
                type="submit"
              >
                <Download className="h-5 w-5" />
                Download All Documents
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
