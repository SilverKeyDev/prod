export interface User {
  id: string;
  name: string;
  email: string;
  agencyName?: string;
  phone?: string;
  profilePicture?: string;
}

export interface Property {
  id: string;
  address: string;
  images?: File[];
  notes?: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  address: string;
  status: 'generating' | 'completed' | 'failed';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  reportsUsed: number;
  reportsLimit: number;
  billingDate?: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  propertyId?: string;
}