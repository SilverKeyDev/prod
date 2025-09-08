// Chat and communication-related type definitions

export interface Chat {
  id: string;
  title: string;
  propertyAddress: string;
  messages: any[];
  createdAt: Date;
}
