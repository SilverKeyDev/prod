// Offer and negotiation-related type definitions

export type OfferDraft = {
  id: string;
  property_id: string;
  property_address: string;
  offer_price: number;
  earnest_money: number;
  down_payment: number;
  financing_type: string;
  closing_date: string;
  inspection_period: number;
  appraisal_contingency: boolean;
  financing_contingency: boolean;
  sale_contingency: boolean;
  inclusions: string[];
  exclusions: string[];
  special_terms?: string;
  cover_letter?: string;
  status: "draft" | "submitted" | "accepted" | "rejected" | "countered";
  created_at: Date;
  updated_at: Date;
};

export type OfferHistory = {
  id: string;
  property_id: string;
  offer_price: number;
  status: string;
  submitted_at: Date;
  response_date?: Date;
  counter_offer?: number;
  notes?: string;
};
