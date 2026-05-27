export type ChatRole = 'assistant' | 'user';

export interface QuestionOption {
  label: string;   // displayed on the chip
  value: string;   // sent to the AI (may differ from label)
  isOther?: boolean; // shows an inline text input instead
}

export interface VenueCard {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  creditCost: number;
  category: string;
}

export interface CoachReply {
  text: string;
  venueCards?: VenueCard[];
  searchQuery?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: Date;
  venueCards?: VenueCard[];
  searchQuery?: string;
  // Q&A fields
  questionOptions?: QuestionOption[];
  questionAnswered?: boolean;
  selectedAnswer?: string;
  // Inline category picker
  categoryPicker?: boolean;
  categoryPickerAnswered?: boolean;
}

export interface SuggestionChip {
  id: string;
  text: string;
  prompt: string;
}
