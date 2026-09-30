'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { showToast } from '@/lib/utils/toast';
import type { AIChatMessage } from '@/types/ai';

interface UseAIAnalysisOptions {
  pageId: number;
}

interface AIAnalysisResponse {
  data: {
    pageId: number;
    instruction: string;
    text: string;
  };
}

/**
 * Hook to manage AI conversational assistant
 */
export const useAIAnalysis = ({ pageId }: UseAIAnalysisOptions) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);

  // Mutation pour analyser le plan avec l'IA
  const analysisMutation = useMutation({
    mutationFn: async (instruction: string) => {
      const response = await apiClient.post<AIAnalysisResponse>(
        `/ai/pages/${pageId}/analyse`,
        { instruction }
      );
      return response.data;
    },
    onMutate: (instruction) => {
      // Ajouter le message de l'utilisateur immédiatement
      const userMessage: AIChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: instruction,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    },
    onSuccess: (response) => {
      console.log('[useAIAnalysis] API response:', response);

      // La réponse est dans response.data
      const data = response.data || response;

      // Ajouter la réponse de l'assistant
      const assistantMessage: AIChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Analyse terminée',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error: any) => {
      console.error('AI Analysis error:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'analyse';
      showToast.error(errorMessage);

      // Ajouter un message d'erreur
      const errorMsg: AIChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Désolé, une erreur est survenue: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  // Envoyer une question/instruction
  const sendInstruction = useCallback((instruction: string) => {
    if (!instruction.trim()) return;
    analysisMutation.mutate(instruction.trim());
  }, [analysisMutation]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    // State
    messages,
    isAnalyzing: analysisMutation.isPending,

    // Actions
    sendInstruction,
    clearChat,
  };
};
