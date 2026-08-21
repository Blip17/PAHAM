// Skeleton & Loading State Primitives for PAHAM Design System
// Subtle pulse on parchment surfaces without aggressive flashing

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  }[variant];

  return (
    <div
      className={`bg-paper-200/80 animate-pulse ${variantClasses} ${className}`}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Memuat materi belajar...',
}) => {
  return (
    <div className="py-20 text-center space-y-3 font-serif">
      <div className="w-8 h-8 rounded-full border-2 border-moss-800 border-t-transparent animate-spin mx-auto" />
      <p className="text-xs text-ink-500">{message}</p>
    </div>
  );
};
