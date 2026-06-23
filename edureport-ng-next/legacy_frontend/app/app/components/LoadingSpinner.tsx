"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md', color = 'green' }: { size?: 'sm' | 'md' | 'lg', color?: 'green' | 'white' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const colors = {
    green: 'border-green',
    white: 'border-white'
  };

  return (
    <div className={`border-2 border-t-transparent rounded-full animate-spin ${sizes[size]} ${colors[color]}`} />
  );
}

export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <div className="animate-pulse flex gap-4 p-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 bg-panel rounded flex-1" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse metric-card">
      <div className="h-3 w-20 bg-panel rounded mb-3" />
      <div className="h-8 w-24 bg-panel rounded mb-2" />
      <div className="h-3 w-32 bg-panel rounded" />
    </div>
  );
}
