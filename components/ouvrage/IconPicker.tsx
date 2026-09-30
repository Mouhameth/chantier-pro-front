'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  type?: 'category' | 'item';
}

const CATEGORY_ICONS = [
  '🏗️', '⚡', '🚰', '🔧', '🔨', '🏠', '🧱', '🪟',
  '🚪', '🔩', '⚙️', '🛠️', '📐', '📏', '🎨', '🖌️',
  '🪚', '🔌', '💡', '🚿', '🛁', '🚽', '🧰', '📦',
  '🏢', '🏘️', '🏗', '🏭', '⛏️', '🔧', '🪛', '⚒️',
];

const ITEM_ICONS = [
  // Électricité
  '💡', '🔌', '⚡', '🔋', '💻', '📱', '🔦', '🕯️',
  // Plomberie
  '🚰', '🚿', '🛁', '🚽', '🧴', '🧽', '🧹', '🪣',
  // Outils
  '🔨', '🔧', '🪛', '🪚', '⚒️', '🛠️', '⛏️', '🪓',
  // Matériaux
  '🧱', '🪵', '🪨', '⛓️', '🔩', '📌', '📍', '🔗',
  // Portes/Fenêtres
  '🚪', '🪟', '🔑', '🔐', '🔒', '🔓', '🪞', '🖼️',
  // Finitions
  '🎨', '🖌️', '🖍️', '✏️', '🖊️', '📐', '📏', '📝',
  // Général
  '📦', '📋', '📊', '📈', '✅', '❌', '⚠️', '🔺',
  '🔻', '🔶', '🔷', '🔸', '🔹', '⭐', '🌟', '💫',
];

export default function IconPicker({ value, onChange, type = 'item' }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const icons = type === 'category' ? CATEGORY_ICONS : ITEM_ICONS;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const dropdown = isOpen && typeof window !== 'undefined' ? (
    createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] w-full max-w-xs bg-white border-2 border-indigo-300 rounded-lg shadow-2xl p-3"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          minWidth: `${dropdownPosition.width}px`,
        }}
      >
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-700">
            {type === 'category' ? 'Icônes de catégories' : 'Icônes d\'items'}
          </p>
          <span className="text-xs text-gray-500">{icons.length} icônes</span>
        </div>
        <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
          {icons.map((icon, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onChange(icon);
                setIsOpen(false);
              }}
              className={`w-8 h-8 flex items-center justify-center text-xl rounded hover:bg-indigo-100 transition-colors ${
                value === icon ? 'bg-indigo-200 ring-2 ring-indigo-500' : ''
              }`}
              title={icon}
            >
              {icon}
            </button>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ou tapez un emoji"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-indigo-500"
            maxLength={2}
          />
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:border-indigo-500 transition-colors flex items-center justify-between bg-white"
          title="Choisir une icône"
        >
          <span className="text-sm text-gray-600 flex items-center gap-2">
            {value ? (
              <>
                <span className="text-lg">{value}</span>
                <span className="text-xs">Changer</span>
              </>
            ) : (
              <>
                <Smile className="w-4 h-4" />
                <span>Choisir une icône</span>
              </>
            )}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="text-xs text-red-600 hover:text-red-700 px-3 py-2 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
            title="Effacer l'icône"
          >
            Effacer
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
}
