'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  XCircle,
  Layers,
  Package,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { ouvrageApi } from '@/lib/api/ouvrage';
import { showToast } from '@/lib/utils/toast';
import type { OuvrageCategory, OuvrageItem } from '@/types/ouvrage';
import IconPicker from './IconPicker';

interface OuvrageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OuvrageManagementModal({ isOpen, onClose }: OuvrageManagementModalProps) {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [addingItemToCategoryId, setAddingItemToCategoryId] = useState<number | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    color: '#3B82F6',
    icon: '',
    description: '',
  });

  const [itemForm, setItemForm] = useState({
    title: '',
    unit: 'u',
    unitPrice: '',
    color: '',
    reference: '',
    description: '',
    icon: '',
  });

  // Fetch categories
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['ouvrage-categories'],
    queryFn: () => ouvrageApi.listCategories(true),
    enabled: isOpen,
  });

  const categories = categoriesData?.data || [];

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: ouvrageApi.createCategory,
    onSuccess: () => {
      showToast.success('Catégorie créée');
      queryClient.invalidateQueries({ queryKey: ['ouvrage-categories'] });
      resetCategoryForm();
      setIsAddingCategory(false);
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la création');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      ouvrageApi.updateCategory(id, data),
    onSuccess: () => {
      showToast.success('Catégorie modifiée');
      queryClient.invalidateQueries({ queryKey: ['ouvrage-categories'] });
      setEditingCategory(null);
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la modification');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: ouvrageApi.deleteCategory,
    onSuccess: () => {
      showToast.success('Catégorie supprimée');
      queryClient.invalidateQueries({ queryKey: ['ouvrage-categories'] });
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  const createItemMutation = useMutation({
    mutationFn: ouvrageApi.createItem,
    onSuccess: () => {
      showToast.success('Item créé');
      queryClient.invalidateQueries({ queryKey: ['ouvrage-categories'] });
      resetItemForm();
      setAddingItemToCategoryId(null);
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la création');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ouvrageApi.updateItem(id, data),
    onSuccess: () => {
      showToast.success('Item modifié');
      queryClient.invalidateQueries({ queryKey: ['ouvrage-categories'] });
      setEditingItem(null);
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la modification');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ouvrageApi.deleteItem,
    onSuccess: () => {
      showToast.success('Item supprimé');
      queryClient.invalidateQueries({ queryKey: ['ouvrage-categories'] });
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  const seedDefaultCategoriesMutation = useMutation({
    mutationFn: ouvrageApi.seedDefaultCategories,
    onSuccess: (data) => {
      showToast.success(
        `${data.categoryCount} catégories et ${data.itemCount} items créés avec succès`
      );
      queryClient.invalidateQueries({ queryKey: ['ouvrage-categories'] });
    },
    onError: (error: any) => {
      showToast.error(error.message || 'Erreur lors de l\'initialisation des catégories par défaut');
    },
  });

  const resetCategoryForm = () => {
    setCategoryForm({ title: '', color: '#3B82F6', icon: '', description: '' });
  };

  const resetItemForm = () => {
    setItemForm({
      title: '',
      unit: 'u',
      unitPrice: '',
      color: '',
      reference: '',
      description: '',
      icon: '',
    });
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreateCategory = () => {
    if (!categoryForm.title.trim()) {
      showToast.error('Le titre est requis');
      return;
    }
    createCategoryMutation.mutate({
      title: categoryForm.title,
      color: categoryForm.color,
      icon: categoryForm.icon || undefined,
      description: categoryForm.description || undefined,
    });
  };

  const handleUpdateCategory = (category: OuvrageCategory) => {
    updateCategoryMutation.mutate({
      id: category.id,
      data: {
        title: categoryForm.title,
        color: categoryForm.color,
        icon: categoryForm.icon || undefined,
        description: categoryForm.description || undefined,
      },
    });
  };

  const startEditingCategory = (category: OuvrageCategory) => {
    setEditingCategory(category.id);
    setCategoryForm({
      title: category.title,
      color: category.color,
      icon: category.icon || '',
      description: category.description || '',
    });
  };

  const handleCreateItem = (categoryId: number) => {
    if (!itemForm.title.trim()) {
      showToast.error('Le titre est requis');
      return;
    }

    if (!itemForm.unit.trim()) {
      showToast.error('L\'unité est requise');
      return;
    }

    // Find parent category to inherit color if not provided
    const parentCategory = categories.find((c) => c.id === categoryId);
    const itemColor = itemForm.color || parentCategory?.color;

    createItemMutation.mutate({
      categoryId,
      title: itemForm.title,
      unit: itemForm.unit,
      unitPrice: itemForm.unitPrice ? parseFloat(itemForm.unitPrice) : undefined,
      color: itemColor,
      reference: itemForm.reference || undefined,
      description: itemForm.description || undefined,
      icon: itemForm.icon || undefined,
    });
  };

  const handleUpdateItem = (item: OuvrageItem) => {
    if (!itemForm.title.trim()) {
      showToast.error('Le titre est requis');
      return;
    }

    if (!itemForm.unit.trim()) {
      showToast.error('L\'unité est requise');
      return;
    }

    updateItemMutation.mutate({
      id: item.id,
      data: {
        title: itemForm.title,
        unit: itemForm.unit,
        unitPrice: itemForm.unitPrice ? parseFloat(itemForm.unitPrice) : undefined,
        color: itemForm.color || undefined,
        reference: itemForm.reference || undefined,
        description: itemForm.description || undefined,
        icon: itemForm.icon || undefined,
      },
    });
  };

  const startEditingItem = (item: OuvrageItem) => {
    setEditingItem(item.id);
    setItemForm({
      title: item.title,
      unit: item.unit,
      unitPrice: item.unitPrice?.toString() || '',
      color: item.color || '',
      reference: item.reference || '',
      description: item.description || '',
      icon: item.icon || '',
    });
  };

  const startAddingItem = (categoryId: number) => {
    setAddingItemToCategoryId(categoryId);

    // Find parent category to inherit color
    const parentCategory = categories.find((c) => c.id === categoryId);
    setItemForm({
      title: '',
      unit: 'u',
      unitPrice: '',
      color: parentCategory?.color || '',
      reference: '',
      description: '',
      icon: '',
    });

    // Auto-expand category
    if (!expandedCategories.includes(categoryId)) {
      toggleCategory(categoryId);
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
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Gestion des types d'ouvrages</h2>
                      <p className="text-sm text-indigo-100">
                        {categories.length} catégorie{categories.length > 1 ? 's' : ''}
                      </p>
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
              <div className="flex-1 overflow-y-auto p-6">
                {/* Empty State - Seed Default Categories */}
                {!isLoading && categories.length === 0 && !isAddingCategory && (
                  <div className="text-center py-12 px-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Aucune catégorie d'ouvrage
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Vous n'avez pas encore créé de catégories. Vous pouvez commencer avec les catégories par défaut ou créer les vôtres.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => seedDefaultCategoriesMutation.mutate()}
                        disabled={seedDefaultCategoriesMutation.isPending}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {seedDefaultCategoriesMutation.isPending ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Initialisation en cours...</span>
                          </>
                        ) : (
                          <>
                            <Layers className="w-5 h-5" />
                            <span>Utiliser les catégories par défaut</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setIsAddingCategory(true)}
                        disabled={seedDefaultCategoriesMutation.isPending}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Créer une catégorie</span>
                      </button>
                    </div>
                    {seedDefaultCategoriesMutation.isPending && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium">
                          Veuillez patienter un instant, initialisation des catégories par défaut...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Add Category Button */}
                {!isAddingCategory && categories.length > 0 && (
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="w-full mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-indigo-600">
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Ajouter une catégorie</span>
                    </div>
                  </button>
                )}

                {/* Add Category Form */}
                {isAddingCategory && (
                  <div className="mb-4 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Nouvelle catégorie</h3>
                    <div className="space-y-3 mb-3">
                      <input
                        type="text"
                        placeholder="Titre *"
                        value={categoryForm.title}
                        onChange={(e) =>
                          setCategoryForm({ ...categoryForm, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Couleur</label>
                          <input
                            type="color"
                            value={categoryForm.color}
                            onChange={(e) =>
                              setCategoryForm({ ...categoryForm, color: e.target.value })
                            }
                            className="w-full h-10 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Icône</label>
                          <IconPicker
                            value={categoryForm.icon}
                            onChange={(icon) => setCategoryForm({ ...categoryForm, icon })}
                            type="category"
                          />
                        </div>
                      </div>
                    </div>
                    <textarea
                      placeholder="Description (optionnel)"
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 mb-3"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleCreateCategory}
                        disabled={createCategoryMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Créer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsAddingCategory(false);
                          resetCategoryForm();
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Categories List */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Chargement des catégories...</p>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Category Header */}
                        <div
                          className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          style={{
                            background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`,
                          }}
                        >
                          {editingCategory === category.id ? (
                            /* Edit Category Form */
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={categoryForm.title}
                                onChange={(e) =>
                                  setCategoryForm({ ...categoryForm, title: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Couleur</label>
                                  <input
                                    type="color"
                                    value={categoryForm.color}
                                    onChange={(e) =>
                                      setCategoryForm({ ...categoryForm, color: e.target.value })
                                    }
                                    className="w-full h-10 rounded cursor-pointer"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Icône</label>
                                  <IconPicker
                                    value={categoryForm.icon}
                                    onChange={(icon) => setCategoryForm({ ...categoryForm, icon })}
                                    type="category"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleUpdateCategory(category)}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Enregistrer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCategory(null);
                                    resetCategoryForm();
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Category Display */
                            <div className="flex items-center justify-between">
                              <div
                                className="flex items-center gap-3 flex-1"
                                onClick={() => toggleCategory(category.id)}
                              >
                                {expandedCategories.includes(category.id) ? (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-600" />
                                )}
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                                  style={{ backgroundColor: category.color }}
                                >
                                  {category.icon || category.title.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{category.title}</h3>
                                  {category.description && (
                                    <p className="text-xs text-gray-600">{category.description}</p>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {category.items?.length || 0} item{category.items?.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => startEditingCategory(category)}
                                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Supprimer "${category.title}" ?`)) {
                                      deleteCategoryMutation.mutate(category.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                                <button
                                  onClick={() => startAddingItem(category.id)}
                                  className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                                  title="Ajouter un item"
                                >
                                  <Plus className="w-4 h-4 text-indigo-600" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Items List */}
                        {expandedCategories.includes(category.id) && (
                          <div className="p-4 space-y-2">
                            {/* Add Item Form */}
                            {addingItemToCategoryId === category.id && (
                              <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Nouvel item</h4>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                  <input
                                    type="text"
                                    placeholder="Titre *"
                                    value={itemForm.title}
                                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                  />
                                  <select
                                    value={itemForm.unit}
                                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                                  >
                                    <option value="">Sélectionner unité *</option>
                                    <option value="u">u (unité)</option>
                                    <option value="ml">ml (mètre linéaire)</option>
                                    <option value="m2">m² (mètre carré)</option>
                                    <option value="m3">m³ (mètre cube)</option>
                                    <option value="kg">kg (kilogramme)</option>
                                    <option value="t">t (tonne)</option>
                                    <option value="h">h (heure)</option>
                                    <option value="j">j (jour)</option>
                                    <option value="L">L (litre)</option>
                                    <option value="m">m (mètre)</option>
                                  </select>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Prix unitaire"
                                    value={itemForm.unitPrice}
                                    onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Couleur <span className="text-gray-500">(héritée)</span>
                                    </label>
                                    <input
                                      type="color"
                                      value={itemForm.color || category.color}
                                      onChange={(e) => setItemForm({ ...itemForm, color: e.target.value })}
                                      className="w-full h-8 rounded cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Icône</label>
                                    <IconPicker
                                      value={itemForm.icon}
                                      onChange={(icon) => setItemForm({ ...itemForm, icon })}
                                      type="item"
                                    />
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Référence"
                                  value={itemForm.reference}
                                  onChange={(e) => setItemForm({ ...itemForm, reference: e.target.value })}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 mb-2"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleCreateItem(category.id)}
                                    disabled={createItemMutation.isPending}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    Créer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setAddingItemToCategoryId(null);
                                      resetItemForm();
                                    }}
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Items */}
                            {category.items && category.items.length > 0 ? (
                              category.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                                >
                                  {editingItem === item.id ? (
                                    /* Edit Item Form */
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-3 gap-2">
                                        <input
                                          type="text"
                                          value={itemForm.title}
                                          onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                                          className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                        />
                                        <select
                                          value={itemForm.unit}
                                          onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                          className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                                        >
                                          <option value="">Unité *</option>
                                          <option value="u">u (unité)</option>
                                          <option value="ml">ml (mètre linéaire)</option>
                                          <option value="m2">m² (mètre carré)</option>
                                          <option value="m3">m³ (mètre cube)</option>
                                          <option value="kg">kg (kilogramme)</option>
                                          <option value="t">t (tonne)</option>
                                          <option value="h">h (heure)</option>
                                          <option value="j">j (jour)</option>
                                          <option value="L">L (litre)</option>
                                          <option value="m">m (mètre)</option>
                                        </select>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={itemForm.unitPrice}
                                          onChange={(e) => setItemForm({ ...itemForm, unitPrice: e.target.value })}
                                          className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Couleur</label>
                                          <input
                                            type="color"
                                            value={itemForm.color || category.color}
                                            onChange={(e) => setItemForm({ ...itemForm, color: e.target.value })}
                                            className="w-full h-8 rounded cursor-pointer"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-700 mb-1">Icône</label>
                                          <IconPicker
                                            value={itemForm.icon}
                                            onChange={(icon) => setItemForm({ ...itemForm, icon })}
                                            type="item"
                                          />
                                        </div>
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Référence"
                                        value={itemForm.reference}
                                        onChange={(e) => setItemForm({ ...itemForm, reference: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={() => handleUpdateItem(item)}
                                        >
                                          <Check className="w-3 h-3 mr-1" />
                                          Enregistrer
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingItem(null);
                                            resetItemForm();
                                          }}
                                        >
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Annuler
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Item Display */
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 flex-1">
                                        {item.icon ? (
                                          <span className="text-lg">{item.icon}</span>
                                        ) : (
                                          <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: item.color || category.color }}
                                          />
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                                            {item.reference && (
                                              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                                {item.reference}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
                                            <span>{item.unit}</span>
                                            {item.unitPrice && (
                                              <>
                                                <span className="text-gray-300">•</span>
                                                <span className="font-semibold">{item.unitPrice}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => startEditingItem(item)}
                                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                          title="Modifier"
                                        >
                                          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`Supprimer "${item.title}" ?`)) {
                                              deleteItemMutation.mutate(item.id);
                                            }
                                          }}
                                          className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                          title="Supprimer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-sm text-gray-500">
                                Aucun item. Cliquez sur <Plus className="w-3 h-3 inline" /> pour ajouter.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <Button variant="outline" onClick={onClose} className="w-full">
                  Fermer
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
