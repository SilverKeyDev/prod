// Report-related type definitions

export interface Report {
  id: string;
  address: string;
  generatedAt: Date;
  status: "completed" | "generating" | "error";
  pdfUrl?: string | null;
  s3Key?: string | null;
}

export interface CompareReport {
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
}

export interface Strategy {
  id: string;
  property_address: string;
  strategy_type: "negotiation" | "offer" | "inspection";
  recommendations: {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    action_items: string[];
  }[];
  market_analysis: {
    comparable_sales: any[];
    market_trends: string;
    pricing_strategy: string;
  };
  created_at: Date;
}

export interface MarketInsight {
  id: string;
  title: string;
  content: string;
  insight_type: "trend" | "opportunity" | "warning" | "tip";
  location?: string;
  property_type?: string;
  relevance_score: number;
  created_at: Date;
  expires_at?: Date;
}
