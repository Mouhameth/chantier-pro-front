'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
}: CardProps) {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseStyles = 'bg-white rounded-lg border border-gray-200 shadow-sm';
  const hoverStyles = hover ? 'transition-shadow duration-200 hover:shadow-md' : '';

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className={`${baseStyles} ${paddings[padding]} ${hoverStyles} ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
