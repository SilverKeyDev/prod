// Chat and communication-related type definitions

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface Chat {
  id: string;
  title: string;
  propertyAddress: string;
  messages: ChatMessage[];
  createdAt: Date;
}
