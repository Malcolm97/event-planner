import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
      default:
        return 'rounded-lg';
    }
  };

  const getSizeClasses = () => {
    const sizeClasses = [];

    if (width) {
      sizeClasses.push(typeof width === 'number' ? `w-[${width}px]` : `w-${width}`);
    }

    if (height) {
      sizeClasses.push(typeof height === 'number' ? `h-[${height}px]` : `h-${height}`);
    }

    return sizeClasses.join(' ');
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${getSizeClasses()}`}
            style={{
              width: index === lines - 1 ? '60%' : '100%', // Last line is shorter
              height: '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : 'auto'),
      }}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC = () => (
  <div className="card p-4 space-y-4">
    <SkeletonLoader variant="rectangular" height="200px" />
    <div className="space-y-3">
      <SkeletonLoader variant="text" width="80%" />
      <SkeletonLoader variant="text" width="60%" />
      <div className="flex space-x-2">
        <SkeletonLoader variant="circular" width="32px" height="32px" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="50%" />
          <SkeletonLoader variant="text" width="30%" />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonEventCard: React.FC = () => (
  <div className="card overflow-hidden">
    <SkeletonLoader variant="rectangular" height="240px" className="rounded-none rounded-t-2xl" />
    <div className="p-4 space-y-3">
      <SkeletonLoader variant="text" width="90%" />
      <SkeletonLoader variant="text" width="70%" />
      <div className="flex items-center space-x-2">
        <SkeletonLoader variant="circular" width="16px" height="16px" />
        <SkeletonLoader variant="text" width="40%" />
      </div>
      <div className="flex items-center space-x-2">
        <SkeletonLoader variant="circular" width="16px" height="16px" />
        <SkeletonLoader variant="text" width="50%" />
      </div>
    </div>
  </div>
);

export const SkeletonGrid: React.FC<{ count?: number; children: React.ReactNode }> = ({
  count = 6,
  children
}) => (
  <div className="responsive-grid">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index}>
        {children}
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
