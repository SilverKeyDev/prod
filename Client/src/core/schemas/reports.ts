// Report-related type definitions

export type Report = {
  id: string;
  address: string;
  generatedAt: Date;
  status: 'completed' | 'generating' | 'error';
  pdfUrl?: string | null;
  s3Key?: string | null;
};

export type CompareReport = {
  id: string;
  address: string;
  generatedAt: Date;
  status: 'generating' | 'completed' | 'error';
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
  strategy_type: 'negotiation' | 'offer' | 'inspection';
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action_items: string[];
  }[];
  market_analysis: {
    comparable_sales: unknown[];
    market_trends: string;
    pricing_strategy: string;
  };
  created_at: Date;
};

export type MarketInsight = {
  id: string;
  title: string;
  content: string;
  insight_type: 'trend' | 'opportunity' | 'warning' | 'tip';
  location?: string;
  property_type?: string;
  relevance_score: number;
  created_at: Date;
  expires_at?: Date;
};
