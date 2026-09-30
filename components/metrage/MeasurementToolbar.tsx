'use client';

import { motion } from 'framer-motion';
import {
  Minus,
  Square,
  Pencil,
  MapPin,
  Box,
  Hand,
  MousePointer,
} from 'lucide-react';
import { MetrageType } from '@/types/metrage';

export type ToolType = MetrageType | 'select' | 'pan';

interface MeasurementToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  disabled?: boolean;
  hasSelectedItem?: boolean;
}

const tools = [
  {
    type: 'select' as ToolType,
    icon: MousePointer,
    label: 'Sélectionner',
    description: 'Sélectionner et déplacer',
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    requiresItem: false,
  },
  {
    type: 'pan' as ToolType,
    icon: Hand,
    label: 'Déplacer',
    description: 'Déplacer la vue',
    color: 'gray',
    gradient: 'from-gray-500 to-gray-600',
    requiresItem: false,
  },
  {
    type: MetrageType.LINE,
    icon: Minus,
    label: 'Ligne',
    description: 'Longueur linéaire (ml)',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    requiresItem: true,
  },
  {
    type: MetrageType.POLYLINE,
    icon: Pencil,
    label: 'Polyligne',
    description: 'Ligne brisée (ml)',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    requiresItem: true,
  },
  {
    type: MetrageType.POLYGON,
    icon: Square,
    label: 'Polygone',
    description: 'Surface (m²)',
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    requiresItem: true,
  },
  {
    type: MetrageType.VOLUME,
    icon: Box,
    label: 'Volume',
    description: 'Volume (m³)',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    requiresItem: true,
  },
  {
    type: MetrageType.POINT,
    icon: MapPin,
    label: 'Point',
    description: 'Comptage (unité)',
    color: 'red',
    gradient: 'from-red-500 to-red-600',
    requiresItem: true,
  },
];

export default function MeasurementToolbar({
  activeTool,
  onToolChange,
  disabled = false,
  hasSelectedItem = false,
}: MeasurementToolbarProps) {
  return (
    <div className="fixed top-24 right-4 z-30">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-3 space-y-2 w-20">
        {/* Toolbar Title */}
        <div className="text-center pb-2 border-b-2 border-gray-200">
          <p className="text-xs font-bold text-gray-700">Outils</p>
        </div>

        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.type;
          const isDisabled = disabled || (tool.requiresItem && !hasSelectedItem);

          return (
            <motion.button
              key={tool.type}
              onClick={() => !isDisabled && onToolChange(tool.type)}
              disabled={isDisabled}
              className={`relative w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all group ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:shadow-lg active:scale-95'
              } ${
                isActive
                  ? `bg-gradient-to-br ${tool.gradient} text-white shadow-lg ring-2 ring-offset-2 ring-${tool.color}-500`
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
              title={tool.description}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : `text-${tool.color}-600`}`} />
              {isActive && (
                <motion.div
                  layoutId="activeToolIndicator"
                  className="absolute inset-0 rounded-xl border-2 border-white"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Tooltip */}
              {!isDisabled && (
                <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                  <div className="font-semibold">{tool.label}</div>
                  <div className="text-gray-300 text-[10px]">{tool.description}</div>
                  <div
                    className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-900"
                  />
                </div>
              )}

              {/* Requires Item Warning */}
              {tool.requiresItem && !hasSelectedItem && (
                <div className="absolute right-full mr-3 px-3 py-2 bg-orange-500 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                  <div className="font-semibold">⚠️ Sélectionner un ouvrage</div>
                  <div className="text-orange-100 text-[10px]">Ouvrez le panneau d'ouvrages</div>
                  <div
                    className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-orange-500"
                  />
                </div>
              )}
            </motion.button>
          );
        })}

        {/* Active Tool Label */}
        {activeTool && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2 border-t-2 border-gray-200"
          >
            <p className="text-[10px] text-center font-medium text-gray-600">
              {tools.find((t) => t.type === activeTool)?.label}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
