'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Tag,
  MessageSquare,
  Euro,
  Ruler,
  Package,
  Eye,
  Droplet,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import type { Measurement } from '@/types/metrage';
import { MetrageType } from '@/types/metrage';

interface MeasurementDetailsModalProps {
  measurement: Measurement | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (measurementId: number, data: {
    label?: string;
    comment?: string;
    unitPriceOverride?: number | null;
    height?: number | null;
    color?: string;
    opacity?: number;
  }) => void;
}

export default function MeasurementDetailsModal({
  measurement,
  isOpen,
  onClose,
  onSave,
}: MeasurementDetailsModalProps) {
  const [label, setLabel] = useState('');
  const [comment, setComment] = useState('');
  const [unitPriceOverride, setUnitPriceOverride] = useState('');
  const [height, setHeight] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    if (measurement) {
      setLabel(measurement.label || '');
      setComment(measurement.comment || '');
      setUnitPriceOverride(
        measurement.unitPriceOverride ? measurement.unitPriceOverride.toString() : ''
      );
      setHeight(measurement.height ? measurement.height.toString() : '');
      setColor(measurement.color || '#3B82F6');
      setOpacity(Math.round(parseFloat(measurement.opacity) * 100));
    }
  }, [measurement]);

  const handleSave = () => {
    if (!measurement) return;

    onSave(measurement.id, {
      label: label.trim() || undefined,
      comment: comment.trim() || undefined,
      unitPriceOverride: unitPriceOverride ? parseFloat(unitPriceOverride) : null,
      height: height ? parseFloat(height) : null,
      color,
      opacity: opacity / 100,
    });

    onClose();
  };

  if (!measurement) return null;

  const originalPrice = measurement.item.unitPrice;
  const currentPrice = unitPriceOverride ? parseFloat(unitPriceOverride) : (originalPrice ? parseFloat(originalPrice.toString()) : 0);
  const quantity = parseFloat(measurement.quantity);
  const total = quantity * currentPrice;

  const isVolume = measurement.type === MetrageType.VOLUME;

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
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-6 py-5 text-white"
                style={{
                  background: `linear-gradient(135deg, ${measurement.category.color} 0%, ${measurement.category.color}dd 100%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                      {measurement.item.icon || '📦'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{measurement.item.title}</h2>
                      <p className="text-sm opacity-90">{measurement.category.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quantity Display */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                      <p className="text-xs opacity-75">Quantité</p>
                      <p className="text-lg font-bold">
                        {quantity.toFixed(2)} {measurement.unit}
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2">
                      <p className="text-xs opacity-75">Prix unitaire</p>
                      <p className="text-lg font-bold flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        {currentPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/30 rounded-xl px-6 py-3 border-2 border-white/40">
                    <p className="text-xs opacity-75">Total</p>
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <Euro className="w-5 h-5" />
                      {total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Label */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    Libellé
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={`Ex: ${measurement.item.title} salon`}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Commentaire
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ajouter des notes ou instructions..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                {/* Price Override */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Euro className="w-4 h-4 text-green-600" />
                    Prix unitaire négocié
                    <span className="text-xs font-normal text-gray-500">
                      (par défaut: {originalPrice ? `${originalPrice} €` : 'non défini'})
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={unitPriceOverride}
                      onChange={(e) => setUnitPriceOverride(e.target.value)}
                      placeholder={originalPrice ? originalPrice.toString() : '0.00'}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      €
                    </span>
                  </div>
                  {unitPriceOverride && parseFloat(unitPriceOverride) !== (originalPrice ? parseFloat(originalPrice.toString()) : 0) && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <span>✓</span>
                      Prix personnalisé appliqué
                    </p>
                  )}
                </div>

                {/* Height (for volumes) */}
                {isVolume && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <Ruler className="w-4 h-4 text-orange-600" />
                      Hauteur (m)
                      <span className="text-xs font-normal text-gray-500">(pour calcul du volume)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="2.5"
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                        m
                      </span>
                    </div>
                  </div>
                )}

                {/* Visual Settings */}
                <div className="border-t-2 border-gray-200 pt-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Apparence
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Couleur
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300"
                        />
                        <div className="flex-1 px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                          {color}
                        </div>
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Droplet className="w-3 h-3" />
                          Opacité
                        </span>
                        <span className="font-bold">{opacity}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={opacity}
                        onChange={(e) => setOpacity(parseInt(e.target.value))}
                        className="w-full h-12 accent-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Annuler
                </Button>
                <Button variant="primary" onClick={handleSave} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
