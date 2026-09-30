/**
 * Types for AI Assistant feature (conversational only)
 */

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string; // Markdown formatted for assistant messages
  timestamp: Date;
}
