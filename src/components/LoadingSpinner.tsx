interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'yellow' | 'blue' | 'gray';
  text?: string;
}

import React from 'react';
const LoadingSpinner = React.memo(function LoadingSpinner({ 
  size = 'md', 
  color = 'yellow', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16'
  };

  const colorClasses = {
    yellow: 'border-yellow-600',
    blue: 'border-blue-600',
    gray: 'border-gray-600'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && (
        <p className="text-gray-500 mt-4 text-sm">{text}</p>
      )}
    </div>
  );
});
export default LoadingSpinner;