'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Scale, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (realDistance: number, scale?: string, applyToAll?: boolean) => void;
  pixelDistance: number;
  showApplyToAll?: boolean;
}

export default function CalibrationModal({
  isOpen,
  onClose,
  onSubmit,
  pixelDistance,
  showApplyToAll = false,
}: CalibrationModalProps) {
  const [realDistance, setRealDistance] = useState('');
  const [scale, setScale] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRealDistance('');
      setScale('');
      setApplyToAll(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const distance = parseFloat(realDistance);
    if (isNaN(distance) || distance <= 0) {
      setError('Veuillez entrer une distance valide supérieure à 0');
      return;
    }

    onSubmit(distance, scale || undefined, applyToAll);
    onClose();
  };

  const calculatedPixelsPerMeter = realDistance
    ? (pixelDistance / parseFloat(realDistance)).toFixed(2)
    : '0';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Calibration du plan</h2>
                      <p className="text-sm text-purple-100">Définir l'échelle de référence</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Pixel Distance Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Ruler className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Distance tracée sur le plan
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {pixelDistance.toFixed(2)} <span className="text-sm font-normal">pixels</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real Distance Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Distance réelle <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={realDistance}
                      onChange={(e) => {
                        setRealDistance(e.target.value);
                        setError('');
                      }}
                      placeholder="Ex: 5.0"
                      className="w-full px-4 py-3 pr-20 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-lg font-semibold"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      mètres
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Entrez la distance réelle correspondant à la ligne tracée
                  </p>
                </div>

                {/* Scale Input (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Échelle du plan <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    placeholder="Ex: 1/50 ou 1:100"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Format: 1/50, 1:100, 1/200, etc.
                  </p>
                </div>

                {/* Calculated Result */}
                {realDistance && parseFloat(realDistance) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-sm font-semibold text-green-900">
                        Échelle calculée
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {calculatedPixelsPerMeter}{' '}
                      <span className="text-sm font-normal">pixels/mètre</span>
                    </p>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </motion.div>
                )}

                {/* Apply to All Option */}
                {showApplyToAll && (
                  <div className="border-t border-gray-200 pt-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={applyToAll}
                        onChange={(e) => setApplyToAll(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                          Appliquer à toutes les pages non calibrées
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Cette échelle sera automatiquement appliquée à toutes les autres pages du plan
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={!realDistance || parseFloat(realDistance) <= 0}
                  >
                    Valider
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
