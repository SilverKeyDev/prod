"""
Pydantic models for offer document generation and management.
These models define the structured data formats for all offer-related documents.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class OfferDecisionAction(str, Enum):
    SEND = "SEND"
    DONT_SEND = "DONT_SEND"

class PreApprovalAction(str, Enum):
    SEND_PREAPPROVAL = "SEND_PREAPPROVAL"
    SEND_PROOF_OF_FUNDS = "SEND_PROOF_OF_FUNDS"
    DONT_SEND = "DONT_SEND"

class EarnestMoneyAction(str, Enum):
    INCLUDE_INSTRUCTIONS = "INCLUDE_INSTRUCTIONS"
    DONT_INCLUDE = "DONT_INCLUDE"

class CoverLetterAction(str, Enum):
    INCLUDE = "INCLUDE"
    DONT_INCLUDE = "DONT_INCLUDE"

class DocumentType(str, Enum):
    PURCHASE_AGREEMENT = "purchase_agreement"
    PRE_APPROVAL_LETTER = "pre_approval_letter"
    EARNEST_MONEY_INSTRUCTIONS = "earnest_money_instructions"
    COVER_LETTER = "cover_letter"

class LoanType(str, Enum):
    CONVENTIONAL = "conventional"
    FHA = "fha"
    VA = "va"
    USDA = "usda"
    JUMBO = "jumbo"
    CASH = "cash"

class LetterTone(str, Enum):
    WARM = "warm"
    PROFESSIONAL = "professional"
    PERSONAL = "personal"


# ==================== BASE MODELS ====================

class PersonInfo(BaseModel):
    """Basic person information for buyers, sellers, agents, etc."""
    name: str = Field(..., description="Full name")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")

class PropertyAddress(BaseModel):
    """Structured property address information."""
    line1: str = Field(..., description="Primary address line")
    line2: Optional[str] = Field(None, description="Secondary address line (apt, suite, etc.)")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State abbreviation")
    postal_code: str = Field(..., description="ZIP/postal code")
    
    def full_address(self) -> str:
        """Return formatted full address string."""
        parts = [self.line1]
        if self.line2:
            parts.append(self.line2)
        parts.append(f"{self.city}, {self.state} {self.postal_code}")
        return ", ".join(parts)

class DecisionReason(BaseModel):
    """Base model for decision reasoning."""
    action: str = Field(..., description="The decision action taken")
    reasons: Optional[List[str]] = Field(default_factory=list, description="Reasons for the decision")
    message_to_seller: Optional[str] = Field(None, description="Optional message to seller")


# ==================== PURCHASE AGREEMENT MODELS ====================

class PurchaseOfferDecision(BaseModel):
    """Decision logic for purchase offer submission."""
    action: OfferDecisionAction = Field(..., description="Whether to send the offer")
    reasons: Optional[List[Literal[
        "NotReadyOfficialOffer",
        "ClarifyingDisclosuresOrHOAOrTitle", 
        "RequestSellerPreferredContract"
    ]]] = Field(default_factory=list, description="Reasons if not sending")
    message_to_seller: Optional[str] = Field(None, description="Message to include with offer")

class PurchaseAgreement(BaseModel):
    """Complete purchase agreement document structure."""
    state_template_code: str = Field(..., description="State-specific contract template code")
    buyers: List[PersonInfo] = Field(..., min_items=1, description="Buyer information")
    sellers: Optional[List[PersonInfo]] = Field(default_factory=list, description="Seller information")
    property_address: PropertyAddress = Field(..., description="Property address details")
    offer_price_usd: int = Field(..., ge=0, description="Offer price in USD")
    contingencies: List[str] = Field(default_factory=list, description="Contract contingencies")
    closing_date: str = Field(..., description="Proposed closing date")
    earnest_money_usd: int = Field(..., ge=0, description="Earnest money amount in USD")
    whats_included: List[str] = Field(default_factory=list, description="Items included in sale")
    whats_excluded: List[str] = Field(default_factory=list, description="Items excluded from sale")
    send_decision: PurchaseOfferDecision = Field(..., description="Decision on sending offer")
    generate_agreement: bool = Field(default=True, description="Whether to generate formal agreement")


# ==================== PRE-APPROVAL MODELS ====================

class PreApprovalDecision(BaseModel):
    """Decision logic for pre-approval document submission."""
    action: PreApprovalAction = Field(..., description="Type of financing document to send")
    reasons_if_dont_send: Optional[List[Literal[
        "CashOfferWillSendPOF",
        "WaitingOnPreApprovalButSignalingIntent",
        "OffMarketKnownFinancing"
    ]]] = Field(default_factory=list, description="Reasons if not sending any document")

class LenderInfo(BaseModel):
    """Lender/mortgage company information."""
    name: str = Field(..., description="Lender company name")
    loan_officer: str = Field(..., description="Loan officer name")
    phone: str = Field(..., description="Lender phone number")
    email: str = Field(..., description="Lender email address")
    license_number: Optional[str] = Field(None, description="Lender license number")

class BuyerFinancialInfo(BaseModel):
    """Buyer financial information for pre-approval."""
    name: str = Field(..., description="Buyer name")
    income: int = Field(..., ge=0, description="Annual income")
    credit_score: int = Field(..., ge=300, le=850, description="Credit score")
    debt_to_income_ratio: Optional[float] = Field(None, ge=0, le=1, description="DTI ratio")
    employment_years: Optional[int] = Field(None, ge=0, description="Years of employment")

class PreApprovalLetter(BaseModel):
    """Pre-approval letter document structure."""
    decision: PreApprovalDecision = Field(..., description="Decision on document type")
    document_type: Literal["pre_approval", "proof_of_funds"] = Field(..., description="Type of document")
    loan_amount: int = Field(..., ge=0, description="Approved loan amount")
    loan_type: LoanType = Field(..., description="Type of loan")
    interest_rate: Optional[float] = Field(None, ge=0, description="Interest rate")
    lender_info: Optional[LenderInfo] = Field(None, description="Lender information")
    buyer_info: BuyerFinancialInfo = Field(..., description="Buyer financial information")
    upload_preapproval_letter: Optional[Dict[str, Any]] = Field(None, description="Uploaded pre-approval document")
    upload_proof_of_funds: Optional[Dict[str, Any]] = Field(None, description="Uploaded proof of funds document")


# ==================== EARNEST MONEY MODELS ====================

class EscrowHolderInfo(BaseModel):
    """Escrow holder/title company information."""
    company_name: str = Field(..., description="Escrow company name")
    contact_person: str = Field(..., description="Contact person name")
    phone: str = Field(..., description="Phone number")
    email: str = Field(..., description="Email address")
    address: str = Field(..., description="Company address")
    license_number: Optional[str] = Field(None, description="License number")

class EarnestMoneyDecision(BaseModel):
    """Decision logic for earnest money instructions."""
    action: EarnestMoneyAction = Field(..., description="Whether to include instructions")
    reasons_if_dont_include: Optional[List[Literal[
        "AgreeTermsFirst",
        "SpeedOfferThenProvideLater",
        "EscrowHolderUnspecified"
    ]]] = Field(default_factory=list, description="Reasons if not including")

class EarnestMoneyInstructions(BaseModel):
    """Earnest money instructions document structure."""
    amount_text: str = Field(..., description="Earnest money amount in text format")
    amount_usd: int = Field(..., ge=0, description="Earnest money amount in USD")
    escrow_holder_name: str = Field(..., description="Name of escrow holder")
    payment_timeline_text: str = Field(..., description="Timeline for payment")
    additional_instructions: Optional[str] = Field(None, description="Additional instructions")
    decision: EarnestMoneyDecision = Field(..., description="Decision on including instructions")
    escrow_holder: Optional[EscrowHolderInfo] = Field(None, description="Detailed escrow holder info")


# ==================== COVER LETTER MODELS ====================

class CoverLetterDecision(BaseModel):
    """Decision logic for cover letter inclusion."""
    action: CoverLetterAction = Field(..., description="Whether to include cover letter")
    reasons_if_dont_include: Optional[List[Literal[
        "ListingAgentForbidsLetters",
        "HighlyCompetitiveMarketDiscouraged", 
        "PreferProfessionalOnly"
    ]]] = Field(default_factory=list, description="Reasons if not including")

class BuyerPersonalInfo(BaseModel):
    """Personal buyer information for cover letter."""
    name: str = Field(..., description="Buyer name")
    family_size: int = Field(..., ge=1, description="Family size")
    occupation: str = Field(..., description="Buyer occupation")
    why_this_home: str = Field(..., description="Why they want this specific home")
    personal_story: Optional[str] = Field(None, description="Personal story/background")
    hobbies_interests: Optional[List[str]] = Field(default_factory=list, description="Hobbies and interests")

class OfferHighlights(BaseModel):
    """Key highlights of the offer for cover letter."""
    offer_price: int = Field(..., ge=0, description="Offer price")
    down_payment_percent: int = Field(..., ge=0, le=100, description="Down payment percentage")
    closing_flexibility: bool = Field(default=False, description="Flexible on closing date")
    pre_approved: bool = Field(default=False, description="Pre-approved for financing")
    cash_offer: bool = Field(default=False, description="Cash offer")
    inspection_waiver: bool = Field(default=False, description="Waiving inspection")
    appraisal_waiver: bool = Field(default=False, description="Waiving appraisal")

class CoverLetter(BaseModel):
    """Cover letter document structure."""
    letter_text: str = Field(..., description="Generated cover letter text")
    decision: CoverLetterDecision = Field(..., description="Decision on including letter")
    property_address: PropertyAddress = Field(..., description="Property address")
    seller_name: Optional[str] = Field(None, description="Seller name if known")
    buyer_info: BuyerPersonalInfo = Field(..., description="Buyer personal information")
    offer_highlights: OfferHighlights = Field(..., description="Key offer highlights")
    tone: LetterTone = Field(default=LetterTone.PROFESSIONAL, description="Letter tone")


# ==================== UNIFIED OFFER PACKAGE MODEL ====================

class OfferPackage(BaseModel):
    """Complete offer package containing all documents."""
    package_id: str = Field(..., description="Unique package identifier")
    user_id: str = Field(..., description="User who created the package")
    property_address: PropertyAddress = Field(..., description="Target property address")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    # Document components
    purchase_agreement: Optional[PurchaseAgreement] = Field(None, description="Purchase agreement")
    pre_approval_letter: Optional[PreApprovalLetter] = Field(None, description="Pre-approval letter")
    earnest_money_instructions: Optional[EarnestMoneyInstructions] = Field(None, description="Earnest money instructions")
    cover_letter: Optional[CoverLetter] = Field(None, description="Cover letter")
    
    # Package metadata
    status: Literal["draft", "ready", "submitted", "accepted", "rejected"] = Field(default="draft", description="Package status")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    @validator('updated_at', pre=True, always=True)
    def set_updated_at(cls, v):
        return datetime.utcnow()
    
    def get_included_documents(self) -> List[DocumentType]:
        """Return list of document types included in this package."""
        included = []
        if self.purchase_agreement and self.purchase_agreement.send_decision.action == OfferDecisionAction.SEND:
            included.append(DocumentType.PURCHASE_AGREEMENT)
        if self.pre_approval_letter and self.pre_approval_letter.decision.action != PreApprovalAction.DONT_SEND:
            included.append(DocumentType.PRE_APPROVAL_LETTER)
        if self.earnest_money_instructions and self.earnest_money_instructions.decision.action == EarnestMoneyAction.INCLUDE_INSTRUCTIONS:
            included.append(DocumentType.EARNEST_MONEY_INSTRUCTIONS)
        if self.cover_letter and self.cover_letter.decision.action == CoverLetterAction.INCLUDE:
            included.append(DocumentType.COVER_LETTER)
        return included
    
    def is_ready_to_submit(self) -> bool:
        """Check if offer package is ready for submission."""
        # At minimum, must have purchase agreement ready to send
        if not self.purchase_agreement or self.purchase_agreement.send_decision.action != OfferDecisionAction.SEND:
            return False
        
        # Must have some form of financing documentation if not cash
        if not any([
            self.pre_approval_letter and self.pre_approval_letter.decision.action != PreApprovalAction.DONT_SEND,
            self.purchase_agreement.offer_price_usd == 0  # Assuming 0 means cash offer
        ]):
            return False
            
        return True


# ==================== REQUEST/RESPONSE MODELS ====================

class GenerateOfferRequest(BaseModel):
    """Request model for generating offer documents."""
    section_type: Literal["purchase_agreement", "preapproval", "earnest_money", "buyer_letter"]
    property_address: str = Field(..., description="Property address")
    params: Dict[str, Any] = Field(default_factory=dict, description="Section-specific parameters")
    user_preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")

class GenerateOfferResponse(BaseModel):
    """Response model for offer generation."""
    success: bool = Field(..., description="Whether generation succeeded")
    document_id: str = Field(..., description="Generated document ID")
    document_type: DocumentType = Field(..., description="Type of document generated")
    status: Literal["generated", "error"] = Field(..., description="Generation status")
    message: str = Field(..., description="Status message")
    data: Optional[Dict[str, Any]] = Field(None, description="Generated document data")
    error: Optional[str] = Field(None, description="Error message if failed")
