export type ChatRole = 'assistant' | 'user';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: Date;
}

export interface SuggestionChip {
  id: string;
  text: string;
  prompt: string;
}
