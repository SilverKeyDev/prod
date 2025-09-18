// Chat and communication-related type definitions

export type Chat = {
  id: string;
  title: string;
  propertyAddress: string;
  messages: unknown[];
  createdAt: Date;
};
