'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, Copy, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { BlueprintPage } from '@/types/blueprint';

interface CalibrationSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibratedPages: BlueprintPage[];
  onCopyCalibration: (pageId: number) => void;
  onManualCalibration: () => void;
  currentPageNumber: number;
}

export default function CalibrationSuggestionModal({
  isOpen,
  onClose,
  calibratedPages,
  onCopyCalibration,
  onManualCalibration,
  currentPageNumber,
}: CalibrationSuggestionModalProps) {
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
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Ruler className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Page {currentPageNumber} non calibrée</h2>
                      <p className="text-sm text-orange-100">Choisir une méthode de calibration</p>
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
              <div className="p-6 space-y-5">
                {/* Info */}
                <div className="text-center">
                  <p className="text-gray-700">
                    Cette page n'est pas encore calibrée.
                    <br />
                    Souhaitez-vous copier l'échelle d'une page existante ?
                  </p>
                </div>

                {/* Calibrated Pages List */}
                {calibratedPages.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Pages déjà calibrées
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {calibratedPages.map((page) => (
                        <button
                          key={page.id}
                          onClick={() => onCopyCalibration(page.id)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 rounded-lg transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-700">
                                P{page.pageNumber}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-900">
                                Page {page.pageNumber}
                                {page.title && (
                                  <span className="text-gray-500 ml-2">• {page.title}</span>
                                )}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {page.scale && (
                                  <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                    {page.scale}
                                  </span>
                                )}
                                <span className="text-xs text-gray-600">
                                  {page.pixelsPerMeter && Number(page.pixelsPerMeter).toFixed(2)} px/m
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Copier</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Ruler className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Aucune page calibrée disponible.
                      <br />
                      Vous devez calibrer manuellement cette page.
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">ou</span>
                  </div>
                </div>

                {/* Manual Calibration Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onManualCalibration}
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  Calibrer manuellement cette page
                </Button>

                {/* Cancel */}
                <Button variant="ghost" className="w-full" onClick={onClose}>
                  Annuler
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
