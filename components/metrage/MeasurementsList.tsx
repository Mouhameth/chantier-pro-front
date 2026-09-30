'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Euro,
  X,
  ListOrdered,
  TrendingUp,
} from 'lucide-react';
import type { Measurement } from '@/types/metrage';
import { MetrageType } from '@/types/metrage';

interface MeasurementsListProps {
  measurements: Measurement[];
  onEdit: (measurement: Measurement) => void;
  onDelete: (measurementId: number) => void;
  onToggleVisibility: (measurementId: number) => void;
  onSelect: (measurementId: number) => void;
  selectedMeasurementId: number | null;
  isOpen: boolean;
  onToggle: () => void;
}

const getTypeLabel = (type: MetrageType): string => {
  switch (type) {
    case MetrageType.LINE:
      return 'Ligne';
    case MetrageType.POLYLINE:
      return 'Polyligne';
    case MetrageType.POLYGON:
      return 'Surface';
    case MetrageType.VOLUME:
      return 'Volume';
    case MetrageType.POINT:
      return 'Point';
    default:
      return type;
  }
};

export default function MeasurementsList({
  measurements,
  onEdit,
  onDelete,
  onToggleVisibility,
  onSelect,
  selectedMeasurementId,
  isOpen,
  onToggle,
}: MeasurementsListProps) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Group measurements by category
  const groupedMeasurements = measurements.reduce((acc, measurement) => {
    const categoryId = measurement.categoryId;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category: measurement.category,
        measurements: [],
        totalQuantity: 0,
        totalPrice: 0,
      };
    }
    acc[categoryId].measurements.push(measurement);

    const quantity = parseFloat(measurement.quantity);
    const price = measurement.unitPriceOverride || measurement.item.unitPrice;
    const itemTotal = quantity * (price ? parseFloat(price.toString()) : 0);

    acc[categoryId].totalQuantity += quantity;
    acc[categoryId].totalPrice += itemTotal;

    return acc;
  }, {} as Record<number, { category: any; measurements: Measurement[]; totalQuantity: number; totalPrice: number }>);

  const categories = Object.values(groupedMeasurements);
  const grandTotal = categories.reduce((sum, cat) => sum + cat.totalPrice, 0);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-br from-emerald-500 to-teal-500 text-white px-3 py-6 rounded-l-xl shadow-lg hover:shadow-xl transition-all"
        whileHover={{ x: -5 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex flex-col items-center gap-2">
          <ListOrdered className="w-5 h-5" />
          <span className="text-xs font-bold">{measurements.length}</span>
          {isOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4 -rotate-90" />
          )}
        </div>
      </motion.button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <ListOrdered className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Métrages</h2>
                      <p className="text-xs text-emerald-100">
                        {measurements.length} mesure{measurements.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onToggle}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grand Total */}
              {grandTotal > 0 && (
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-gray-900">Total estimé</span>
                    </div>
                    <div className="flex items-center gap-1 text-2xl font-bold text-emerald-700">
                      <Euro className="w-5 h-5" />
                      {grandTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto p-4">
                {measurements.length === 0 ? (
                  <div className="text-center py-12">
                    <ListOrdered className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Aucun métrage</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Sélectionnez un ouvrage et dessinez sur le plan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((group) => {
                      const isExpanded = expandedCategories.includes(group.category.id);

                      return (
                        <div
                          key={group.category.id}
                          className="border-2 border-gray-200 rounded-xl overflow-hidden"
                        >
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(group.category.id)}
                            className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            style={{
                              background: `linear-gradient(135deg, ${group.category.color}15 0%, ${group.category.color}05 100%)`,
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              )}
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ backgroundColor: group.category.color }}
                              >
                                {group.category.icon || group.category.title.charAt(0)}
                              </div>
                              <div className="flex-1 text-left">
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {group.category.title}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {group.measurements.length} mesure{group.measurements.length > 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm font-bold text-emerald-700">
                                  <Euro className="w-3 h-3" />
                                  {group.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Measurements List */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-2 space-y-2 bg-white">
                                  {group.measurements.map((measurement) => {
                                    const isSelected = selectedMeasurementId === measurement.id;
                                    const price = measurement.unitPriceOverride || measurement.item.unitPrice;
                                    const total = parseFloat(measurement.quantity) * (price ? parseFloat(price.toString()) : 0);

                                    return (
                                      <div
                                        key={measurement.id}
                                        onClick={() => onSelect(measurement.id)}
                                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                          isSelected
                                            ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2 mb-2">
                                          <span className="text-base">{measurement.item.icon || '📦'}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                              {measurement.label || measurement.item.title}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                              {getTypeLabel(measurement.type)}
                                            </p>
                                          </div>
                                          <div
                                            className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                                            style={{ backgroundColor: measurement.color }}
                                          />
                                        </div>

                                        <div className="flex items-center justify-between text-xs mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                              {parseFloat(measurement.quantity).toFixed(2)} {measurement.unit}
                                            </span>
                                            <span className="text-gray-400">×</span>
                                            <span className="text-gray-600">
                                              {price ? `${price} €` : '-'}
                                            </span>
                                          </div>
                                          <div className="font-bold text-emerald-700">
                                            {total.toFixed(2)} €
                                          </div>
                                        </div>

                                        {measurement.comment && (
                                          <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">
                                            {measurement.comment}
                                          </p>
                                        )}

                                        <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onToggleVisibility(measurement.id);
                                            }}
                                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                            title="Afficher/Masquer"
                                          >
                                            <Eye className="w-3.5 h-3.5 text-gray-600" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEdit(measurement);
                                            }}
                                            className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                            title="Modifier"
                                          >
                                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm(`Supprimer "${measurement.label || measurement.item.title}" ?`)) {
                                                onDelete(measurement.id);
                                              }
                                            }}
                                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                            title="Supprimer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
