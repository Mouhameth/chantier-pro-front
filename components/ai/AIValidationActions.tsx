'use client';

import React from 'react';
import { CheckCircle2, X, CheckSquare, Square } from 'lucide-react';

interface AIValidationActionsProps {
  totalElements: number;
  selectedCount: number;
  onValidate: () => void;
  onCancel: () => void;
  onToggleAll: (select: boolean) => void;
}

/**
 * Actions de validation des éléments proposés par l'IA
 */
export const AIValidationActions: React.FC<AIValidationActionsProps> = ({
  totalElements,
  selectedCount,
  onValidate,
  onCancel,
  onToggleAll,
}) => {
  const allSelected = selectedCount === totalElements;
  const someSelected = selectedCount > 0 && selectedCount < totalElements;

  return (
    <div className="border-t bg-purple-50 p-4 space-y-3">
      {/* Selection info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          <span className="text-sm font-medium text-gray-900">
            Preview actif: {selectedCount}/{totalElements} éléments
          </span>
        </div>
        <button
          onClick={() => onToggleAll(!allSelected)}
          className="flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 transition-colors"
        >
          {allSelected ? (
            <>
              <CheckSquare className="w-4 h-4" />
              <span>Tout désélectionner</span>
            </>
          ) : (
            <>
              <Square className="w-4 h-4" />
              <span>Tout sélectionner</span>
            </>
          )}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onValidate}
          disabled={selectedCount === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Valider ({selectedCount})</span>
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          <span>Annuler</span>
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Cliquez sur les éléments du canvas pour les sélectionner/désélectionner
      </p>
    </div>
  );
};
