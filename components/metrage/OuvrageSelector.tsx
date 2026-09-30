'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Check,
  Package,
  Euro,
} from 'lucide-react';
import { ouvrageApi } from '@/lib/api/ouvrage';
import type { OuvrageCategory, OuvrageItem } from '@/types/ouvrage';

interface OuvrageSelectorProps {
  selectedCategoryId: number | null;
  selectedItemId: number | null;
  onSelectItem: (categoryId: number, itemId: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function OuvrageSelector({
  selectedCategoryId,
  selectedItemId,
  onSelectItem,
  isOpen,
  onToggle,
}: OuvrageSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['ouvrage-categories'],
    queryFn: () => ouvrageApi.listCategories(true),
  });

  const categories = categoriesData?.data || [];

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter categories and items based on search
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

  // Get selected item details
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedItem = selectedCategory?.items?.find((i) => i.id === selectedItemId);

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-gradient-to-br from-indigo-500 to-purple-500 text-white px-3 py-6 rounded-r-xl shadow-lg hover:shadow-xl transition-all"
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex flex-col items-center gap-2">
          <Package className="w-5 h-5" />
          {isOpen ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4 rotate-90" />
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
              initial={{ x: -400 }}
              animate={{ x: 0 }}
              exit={{ x: -400 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Types d'ouvrages</h2>
                      <p className="text-xs text-indigo-100">Sélectionner pour mesurer</p>
                    </div>
                  </div>
                  <button
                    onClick={onToggle}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un ouvrage..."
                    className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-indigo-200 focus:outline-none focus:bg-white/30 focus:border-white/50 transition-all"
                  />
                </div>
              </div>

              {/* Selected Item Display */}
              {selectedItem && (
                <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">Sélectionné</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedItem.icon || '📦'}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{selectedItem.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {selectedItem.unit}
                        </span>
                        {selectedItem.unitPrice && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-green-700 font-semibold">
                              <Euro className="w-3 h-3" />
                              {selectedItem.unitPrice}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-600">Chargement...</div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Aucun ouvrage trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 transition-colors"
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
                        <AnimatePresence>
                          {expandedCategories.includes(category.id) && category.items && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-2 space-y-1 bg-white">
                                {category.items.map((item) => {
                                  const isSelected =
                                    selectedCategoryId === category.id &&
                                    selectedItemId === item.id;
                                  return (
                                    <button
                                      key={item.id}
                                      onClick={() => onSelectItem(category.id, item.id)}
                                      className={`w-full p-2 rounded-lg text-left transition-all ${
                                        isSelected
                                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 shadow-sm'
                                          : 'hover:bg-gray-50 border-2 border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        {isSelected && (
                                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        )}
                                        {item.icon && (
                                          <span className="text-base">{item.icon}</span>
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p
                                            className={`text-sm font-medium truncate ${
                                              isSelected ? 'text-green-900' : 'text-gray-900'
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
                                                <span className="flex items-center gap-0.5">
                                                  <Euro className="w-3 h-3" />
                                                  {item.unitPrice}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
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
