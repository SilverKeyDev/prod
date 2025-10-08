// Report-related type definitions

export type Report = {
  id: string;
  address: string;
  generatedAt: Date;
  status: "completed" | "generating" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
};

export type CompareReport = {
  id: string;
  address: string;
  generatedAt: Date;
  status: "generating" | "completed" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
  price?: number;
  squareFootage?: number;
  yearBuilt?: number;
  propertyType?: string;
  estimatedValue?: number;
  neighborhoodScore?: number;
  schoolScore?: number;
};

export type Strategy = {
  id: string;
  property_address: string;
  strategy_type: "negotiation" | "offer" | "inspection";
  price_section: {
    max_price: number;
    opening_offer: number;
    price_rationale: string;
    credits_and_terms: string[];
    inspection_plan: string;
    timeline: string;
    offer_strength: string;
  };
  counter_section: {
    max_rounds: number;
    concessions_you_can_make: string[];
    escalation_strategy: string;
    emotion_control_notes: string;
  };
  market_section: {
    local_market_stats: string[];
    buyer_leverage: string;
    comps: string[];
    national_snapshot: string;
  };
  copy_paste_section: {
    offer_text: string;
    key_talking_points: string[];
  };
  created_at: Date;
};

export type MarketInsight = {
  id: string;
  title: string;
  content: string;
  insight_type: "trend" | "opportunity" | "warning" | "tip";
  location?: string;
  property_type?: string;
  relevance_score: number;
  created_at: Date;
  expires_at?: Date;
};
