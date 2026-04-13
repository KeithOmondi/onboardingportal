export type RecipientType = 'single' | 'group' | 'broadcast';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id?: string;
  recipient_type: RecipientType;
  target_roles?: string[];
  message: string;
  created_at: string;
  _tempId?: string; // Dates often come as strings over JSON
}

export interface SendMessageDTO {
  recipient_id?: string;
  recipient_type: RecipientType;
  target_roles?: string[];
  message: string;
}

// Add this to fix the error
export interface ChatConversation {
  partner_id: string;
  last_direction: 'sent' | 'received';
  message: string;
  created_at: string;
}