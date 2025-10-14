import React, { useState, useEffect } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';
import { RateLimitInfo } from '@/lib/apiClient';

interface RateLimitIndicatorProps {
  rateLimitInfo: RateLimitInfo | null;
  className?: string;
}

export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  rateLimitInfo,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!rateLimitInfo?.retryAfter) return;

    setTimeLeft(rateLimitInfo.retryAfter);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitInfo?.retryAfter]);

  if (!rateLimitInfo || rateLimitInfo.remaining > 10) {
    return null; // Don't show if rate limit is not an issue
  }

  const isLimited = rateLimitInfo.remaining === 0;
  const isWarning = rateLimitInfo.remaining <= 5;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isLimited
        ? 'bg-red-50 text-red-700 border border-red-200'
        : isWarning
        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        : 'bg-blue-50 text-blue-700 border border-blue-200'
    } ${className}`}>
      {isLimited ? (
        <FiAlertTriangle size={16} />
      ) : (
        <FiClock size={16} />
      )}

      <span>
        {isLimited ? (
          <>
            Rate limited. Try again in {timeLeft}s
          </>
        ) : (
          <>
            {rateLimitInfo.remaining} requests remaining
          </>
        )}
      </span>
    </div>
  );
};

// Hook for managing rate limit state
export const useRateLimitIndicator = () => {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showRateLimit = (info: RateLimitInfo) => {
    setRateLimitInfo(info);
    setIsVisible(true);

    // Auto-hide after the retry period
    if (info.retryAfter) {
      setTimeout(() => {
        setIsVisible(false);
        setRateLimitInfo(null);
      }, info.retryAfter * 1000);
    }
  };

  const hideRateLimit = () => {
    setIsVisible(false);
    setRateLimitInfo(null);
  };

  return {
    rateLimitInfo,
    isVisible,
    showRateLimit,
    hideRateLimit,
    RateLimitIndicator: (props: Omit<RateLimitIndicatorProps, 'rateLimitInfo'>) => (
      <RateLimitIndicator {...props} rateLimitInfo={rateLimitInfo} />
    )
  };
};
