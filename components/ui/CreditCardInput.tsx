'use client';

import { useState, useEffect } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';

interface CreditCardInputProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  cardNumberValue?: string;
}

// Detect card brand from card number
const detectCardBrand = (cardNumber: string): CardBrand => {
  const cleaned = cardNumber.replace(/\s/g, '');

  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'discover';

  return 'unknown';
};

// Format card number with spaces
const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  const match = cleaned.match(/.{1,4}/g);
  return match ? match.join(' ') : cleaned;
};

// Card brand logos (Images)
const CardLogos = {
  visa: (
    <img src="/visa.png" alt="Visa" className="h-6 w-auto object-contain" />
  ),
  mastercard: (
    <img src="/mastercard.png" alt="Mastercard" className="h-6 w-auto object-contain" />
  ),
  amex: (
    <img src="/amex.png" alt="American Express" className="h-6 w-auto object-contain" />
  ),
  discover: (
    <img src="/discover.png" alt="Discover" className="h-6 w-auto object-contain" />
  ),
  unknown: (
    <svg className="h-6 w-10" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
      <rect x="8" y="10" width="32" height="4" rx="2" fill="#9CA3AF" />
      <rect x="8" y="18" width="20" height="4" rx="2" fill="#9CA3AF" />
    </svg>
  )
};

export default function CreditCardInput({
  register,
  errors,
  cardNumberValue = '',
}: CreditCardInputProps) {
  const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');
  const [formattedNumber, setFormattedNumber] = useState('');

  useEffect(() => {
    const brand = detectCardBrand(cardNumberValue);
    setCardBrand(brand);
    setFormattedNumber(formatCardNumber(cardNumberValue));
  }, [cardNumberValue]);

  return (
    <div className="space-y-4">
      {/* Card Preview - Compact version */}
      <div className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-xl p-4 shadow-xl overflow-hidden h-36">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-24 translate-x-24"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16"></div>
        </div>

        {/* Card content */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Chip and logo */}
          <div className="flex justify-between items-start">
            {/* Chip */}
            <div className="w-9 h-7 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded"></div>
            {/* Card brand logo */}
            <div className="bg-white/10 backdrop-blur-sm rounded px-2 py-1">
              {CardLogos[cardBrand]}
            </div>
          </div>

          {/* Card number */}
          <div className="space-y-2">
            <div className="text-white text-base font-mono tracking-wider">
              {formattedNumber || '•••• •••• •••• ••••'}
            </div>

            {/* Name and expiry */}
            <div className="flex justify-between text-white/80 text-xs">
              <div>
                <div className="text-[10px] text-white/60 uppercase mb-0.5">Titulaire</div>
                <div className="font-medium">Nom sur la carte</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/60 uppercase mb-0.5">Expire</div>
                <div className="font-medium font-mono">MM/YY</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card number input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Numéro de carte
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            {...register('cardNumber', {
              onChange: (e) => {
                const value = e.target.value.replace(/\s/g, '');
                e.target.value = formatCardNumber(value);
              },
            })}
            className={`w-full px-3 py-2 pr-14 border rounded-lg focus:outline-none focus:ring-2 transition-colors font-mono text-sm ${errors.cardNumber
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {CardLogos[cardBrand]}
          </div>
        </div>
        {errors.cardNumber && (
          <p className="mt-1 text-xs text-red-500">{errors.cardNumber.message as string}</p>
        )}
      </div>

      {/* CVV and Expiry */}
      <div className="grid grid-cols-2 gap-3">
        {/* Expiry date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Date d&apos;expiration
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="MM"
                maxLength={2}
                {...register('cardExpMonth', {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '');
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors font-mono text-center text-sm ${errors.cardExpMonth
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                  }`}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="AA"
                maxLength={2}
                {...register('cardExpYear', {
                  onChange: (e) => {
                    e.target.value = e.target.value.replace(/\D/g, '');
                  },
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors font-mono text-center text-sm ${errors.cardExpYear
                    ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                  }`}
              />
            </div>
          </div>
          {(errors.cardExpMonth || errors.cardExpYear) && (
            <p className="mt-1 text-xs text-red-500">
              {(errors.cardExpMonth?.message || errors.cardExpYear?.message) as string}
            </p>
          )}
        </div>

        {/* CVV */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            CVV
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="123"
              maxLength={4}
              {...register('cardCvv', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '');
                },
              })}
              className={`w-full px-3 py-2 pr-9 border rounded-lg focus:outline-none focus:ring-2 transition-colors font-mono text-center text-sm ${errors.cardCvv
                  ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                }`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          {errors.cardCvv && (
            <p className="mt-1 text-xs text-red-500">{errors.cardCvv.message as string}</p>
          )}
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Paiement sécurisé et crypté</span>
      </div>
    </div>
  );
}
