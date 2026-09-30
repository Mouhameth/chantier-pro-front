'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Ruler,
  MessageSquare,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { ouvrageApi } from '@/lib/api/ouvrage';
import { MetrageType } from '@/types/metrage';

interface CreateMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    categoryId: number;
    itemId: number;
    label?: string;
    comment?: string;
    height?: number;
  }) => void;
  measurementType: MetrageType;
  calculatedQuantity: number;
  unit: string;
}

export default function CreateMeasurementModal({
  isOpen,
  onClose,
  onConfirm,
  measurementType,
  calculatedQuantity,
  unit,
}: CreateMeasurementModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [height, setHeight] = useState('');
  const [thickness, setThickness] = useState('');

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['ouvrage-categories'],
    queryFn: () => ouvrageApi.listCategories(true),
    enabled: isOpen,
  });

  const categories = categoriesData?.data || [];

  // Filter categories based on search
  const filteredCategories = categories
    .map((category) => {
      const filteredItems = category.items?.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...category,
        items: filteredItems,
      };
    })
    .filter(
      (category) =>
        category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.items && category.items.length > 0)
    );

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectItem = (categoryId: number, itemId: number) => {
    setSelectedCategoryId(categoryId);
    setSelectedItemId(itemId);
  };

  const handleConfirm = () => {
    if (!selectedCategoryId || !selectedItemId) {
      return;
    }

    // Calculate final height value for m³ from line: height × thickness
    let finalHeight: number | undefined;
    if ((itemUnit === 'm³' || itemUnit === 'm3') && isLineType && height && thickness) {
      // For m³ from line, we multiply height × thickness to get the "height" parameter
      finalHeight = parseFloat(height) * parseFloat(thickness);
    } else if (height && thickness) {
      // If both are provided, use height
      finalHeight = parseFloat(height);
    } else if (height) {
      finalHeight = parseFloat(height);
    } else if (thickness) {
      finalHeight = parseFloat(thickness);
    }

    onConfirm({
      categoryId: selectedCategoryId,
      itemId: selectedItemId,
      label: selectedItem?.title, // Use item title as label
      comment: comment.trim() || undefined,
      height: finalHeight,
    });

    // Reset form
    setSelectedCategoryId(null);
    setSelectedItemId(null);
    setComment('');
    setHeight('');
    setThickness('');
    setSearchQuery('');
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedItem = selectedCategory?.items?.find((i) => i.id === selectedItemId);

  // Auto-expand first category on open
  useEffect(() => {
    if (isOpen && categories.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories([categories[0].id]);
    }
  }, [isOpen, categories]);

  // Contrôle en fonction de l'unité de l'item sélectionné ET du type de métrage
  const itemUnit = selectedItem?.unit;
  const isLineType = measurementType === MetrageType.LINE || measurementType === MetrageType.POLYLINE;
  const isSurfaceType = measurementType === MetrageType.POLYGON || measurementType === MetrageType.VOLUME;

  // Pour m²: toujours hauteur
  // Pour m³ à partir de ligne: hauteur + épaisseur
  // Pour m³ à partir de surface: épaisseur seulement
  const needsHeight = (itemUnit === 'm²' || itemUnit === 'm2') || ((itemUnit === 'm³' || itemUnit === 'm3') && isLineType);
  const needsThickness = (itemUnit === 'm³' || itemUnit === 'm3');

  const getTypeLabel = () => {
    switch (measurementType) {
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
        return 'Métrage';
    }
  };

  const getTypeDescription = () => {
    switch (measurementType) {
      case MetrageType.LINE:
        return 'Mur, cloison, conduit, fondation linéaire...';
      case MetrageType.POLYLINE:
        return 'Mur non droit, conduite avec angles...';
      case MetrageType.POLYGON:
        return 'Dalle, plancher, semelle, surface à peindre...';
      case MetrageType.VOLUME:
        return 'Volume de béton, remblai, excavation...';
      case MetrageType.POINT:
        return 'Comptage d\'éléments (portes, fenêtres, poteaux...)';
      default:
        return '';
    }
  };

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
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">Nouveau métrage - {getTypeLabel()}</h2>
                    <p className="text-xs text-blue-200 mb-2">{getTypeDescription()}</p>
                    <p className="text-sm text-blue-100">
                      {measurementType === MetrageType.LINE || measurementType === MetrageType.POLYLINE ? (
                        <>Longueur mesurée: <span className="font-semibold">{calculatedQuantity.toFixed(2)} ml</span></>
                      ) : measurementType === MetrageType.POLYGON || measurementType === MetrageType.VOLUME ? (
                        <>Surface mesurée: <span className="font-semibold">{calculatedQuantity.toFixed(2)} m²</span></>
                      ) : (
                        <>Quantité: <span className="font-semibold">{calculatedQuantity.toFixed(2)} {unit}</span></>
                      )}
                      {selectedItem && (itemUnit === 'm2' || itemUnit === 'm²') && height && (
                        <> → Surface: <span className="font-semibold">{(calculatedQuantity * parseFloat(height)).toFixed(2)} m²</span></>
                      )}
                      {selectedItem && (itemUnit === 'm3' || itemUnit === 'm³') && isLineType && height && thickness && (
                        <> → Volume: <span className="font-semibold">{(calculatedQuantity * parseFloat(height) * parseFloat(thickness)).toFixed(2)} m³</span></>
                      )}
                      {selectedItem && (itemUnit === 'm3' || itemUnit === 'm³') && isSurfaceType && thickness && (
                        <> → Volume: <span className="font-semibold">{(calculatedQuantity * parseFloat(thickness)).toFixed(2)} m³</span></>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex">
                {/* Left: Ouvrage Selection */}
                <div className="w-1/2 border-r border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      Sélectionner l'ouvrage
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Category Header */}
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-3"
                          style={{
                            background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`,
                          }}
                        >
                          {expandedCategories.includes(category.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          )}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon || category.title.charAt(0)}
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              {category.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {category.items?.length || 0} item{category.items?.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </button>

                        {/* Items List */}
                        {expandedCategories.includes(category.id) && category.items && (
                          <div className="p-2 space-y-1 bg-white">
                            {category.items.map((item) => {
                              const isSelected =
                                selectedCategoryId === category.id && selectedItemId === item.id;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => handleSelectItem(category.id, item.id)}
                                  className={`w-full p-2 rounded-lg text-left transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400 shadow-sm'
                                      : 'hover:bg-gray-50 border-2 border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    )}
                                    {item.icon && (
                                      <span className="text-base">{item.icon}</span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`text-sm font-medium truncate ${
                                          isSelected ? 'text-blue-900' : 'text-gray-900'
                                        }`}
                                      >
                                        {item.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                                          {item.unit}
                                        </span>
                                        {item.unitPrice && (
                                          <>
                                            <span>•</span>
                                            <span>{item.unitPrice} €</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Additional Info */}
                <div className="w-1/2 p-4 flex flex-col">
                  <h3 className="font-semibold text-gray-900 mb-4">Informations complémentaires</h3>

                  <div className="space-y-4 flex-1">
                    {/* Selected Item Display */}
                    {selectedItem && (
                      <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-700 mb-1">Ouvrage sélectionné</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedItem.icon || '📦'}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{selectedItem.title}</p>
                            <p className="text-xs text-gray-600">
                              {selectedCategory?.title} • <span className="font-mono font-bold">{selectedItem.unit}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Height field */}
                    {needsHeight && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Ruler className="w-4 h-4 text-orange-600" />
                          Hauteur (m)
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="Ex: 2.5"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {(itemUnit === 'm²' || itemUnit === 'm2') ? (
                            <>Surface: {height ? (calculatedQuantity * parseFloat(height)).toFixed(2) : '0.00'} m² (longueur × hauteur)</>
                          ) : (itemUnit === 'm³' || itemUnit === 'm3') && !thickness ? (
                            <>Renseignez aussi l'épaisseur pour calculer le volume</>
                          ) : (itemUnit === 'm³' || itemUnit === 'm3') && thickness ? (
                            <>Volume: {(calculatedQuantity * parseFloat(height) * parseFloat(thickness)).toFixed(2)} m³ (longueur × hauteur × épaisseur)</>
                          ) : null}
                        </p>
                      </div>
                    )}

                    {/* Thickness field - for m³ */}
                    {needsThickness && (
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <Ruler className="w-4 h-4 text-purple-600" />
                          Épaisseur (m)
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={thickness}
                          onChange={(e) => setThickness(e.target.value)}
                          placeholder="Ex: 0.15 (dalle 15cm)"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {isLineType && height ? (
                            <>Volume: {(calculatedQuantity * parseFloat(height) * parseFloat(thickness || '0')).toFixed(2)} m³ (longueur × hauteur × épaisseur)</>
                          ) : isSurfaceType ? (
                            <>Volume: {thickness ? (calculatedQuantity * parseFloat(thickness)).toFixed(2) : '0.00'} m³ (surface × épaisseur)</>
                          ) : (
                            <>Renseignez aussi la hauteur pour calculer le volume</>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Comment */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        Commentaire (optionnel)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Notes ou instructions..."
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                    </div>

                    {/* Calculated Total */}
                    {selectedItem?.unitPrice && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Estimation</p>
                        {itemUnit === 'ml' || itemUnit === 'u' ? (
                          // Unités directes (ml, u)
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">
                              {calculatedQuantity.toFixed(2)} {itemUnit} × {selectedItem.unitPrice} €
                            </span>
                            <span className="text-lg font-bold text-green-700">
                              {(calculatedQuantity * parseFloat(selectedItem.unitPrice.toString())).toFixed(2)} €
                            </span>
                          </div>
                        ) : (itemUnit === 'm2' || itemUnit === 'm²') && height ? (
                          // m² : longueur × hauteur
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                              {calculatedQuantity.toFixed(2)} ml × {height} m = {(calculatedQuantity * parseFloat(height)).toFixed(2)} m²
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">
                                {(calculatedQuantity * parseFloat(height)).toFixed(2)} m² × {selectedItem.unitPrice} €
                              </span>
                              <span className="text-lg font-bold text-green-700">
                                {(calculatedQuantity * parseFloat(height) * parseFloat(selectedItem.unitPrice.toString())).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ) : (itemUnit === 'm3' || itemUnit === 'm³') && isLineType && height && thickness ? (
                          // m³ depuis ligne : longueur × hauteur × épaisseur
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                              {calculatedQuantity.toFixed(2)} ml × {height} m × {thickness} m = {(calculatedQuantity * parseFloat(height) * parseFloat(thickness)).toFixed(2)} m³
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">
                                {(calculatedQuantity * parseFloat(height) * parseFloat(thickness)).toFixed(2)} m³ × {selectedItem.unitPrice} €
                              </span>
                              <span className="text-lg font-bold text-green-700">
                                {(calculatedQuantity * parseFloat(height) * parseFloat(thickness) * parseFloat(selectedItem.unitPrice.toString())).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ) : (itemUnit === 'm3' || itemUnit === 'm³') && isSurfaceType && thickness ? (
                          // m³ depuis surface : surface × épaisseur
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                              {calculatedQuantity.toFixed(2)} m² × {thickness} m = {(calculatedQuantity * parseFloat(thickness)).toFixed(2)} m³
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">
                                {(calculatedQuantity * parseFloat(thickness)).toFixed(2)} m³ × {selectedItem.unitPrice} €
                              </span>
                              <span className="text-lg font-bold text-green-700">
                                {(calculatedQuantity * parseFloat(thickness) * parseFloat(selectedItem.unitPrice.toString())).toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-orange-600 italic">
                            {needsHeight && !height && 'Renseignez la hauteur'}
                            {needsThickness && !thickness && needsHeight && !height && ' et '}
                            {needsThickness && !thickness && "l'épaisseur"}
                            {' pour voir l\'estimation'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t-2 border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={
                    !selectedItemId ||
                    (needsHeight && !height) ||
                    (needsThickness && !thickness)
                  }
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Créer le métrage
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
