'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, X } from 'lucide-react';
import type { AIChatMessage as MessageType } from '@/types/ai';
import { AIChatMessage } from './AIChatMessage';

interface AIAssistantPanelProps {
  messages: MessageType[];
  isAnalyzing: boolean;
  onSendInstruction: (instruction: string) => void;
  onClearChat: () => void;
}

/**
 * Panel principal de l'assistant IA (conversationnel uniquement)
 */
export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  messages,
  isAnalyzing,
  onSendInstruction,
  onClearChat,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isAnalyzing) {
      onSendInstruction(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Assistant IA</h3>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            title="Effacer l'historique"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Posez-moi une question
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Je peux vous aider à analyser et métrer ce plan
            </p>
            <div className="space-y-2 w-full">
              <button
                onClick={() => onSendInstruction('Combien de fenêtres y a-t-il sur ce plan ?')}
                className="w-full px-3 py-2 text-xs text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                💡 Combien de fenêtres ?
              </button>
              <button
                onClick={() => onSendInstruction('Quels sont les équipements sanitaires visibles ?')}
                className="w-full px-3 py-2 text-xs text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                💡 Quels équipements sanitaires ?
              </button>
              <button
                onClick={() => onSendInstruction('Décris ce plan')}
                className="w-full px-3 py-2 text-xs text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                💡 Décris ce plan
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <AIChatMessage key={message.id} message={message} />
            ))}
            {isAnalyzing && (
              <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-lg">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <span className="text-sm text-purple-700">Analyse en cours...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Question ou instruction..."
            className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isAnalyzing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
