import React, { useState, useRef, useEffect, memo } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = memo(function LazyImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className = '',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second base delay

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (width: number = 16, height: number = 9) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a simple gradient blur placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(0.5, '#e5e7eb');
      gradient.addColorStop(1, '#f3f4f6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.1);
    }
    return '';
  };

  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // Try to retry loading the image
    if (retryCount < maxRetries && !isRetrying) {
      setIsRetrying(true);
      const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff

      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsRetrying(false);
        setHasError(false); // Reset error state to try again
      }, delay);

      if (process.env.NODE_ENV === 'development') {
        console.log(`Retrying image load for "${alt}" (attempt ${retryCount + 1}/${maxRetries}) after ${delay}ms`);
      }
      return;
    }

    // All retries failed, show error state
    setHasError(true);
    onError?.();

    if (process.env.NODE_ENV === 'development') {
      console.error(`Failed to load image "${alt}" after ${maxRetries} retries. URL: ${src}`);
    }
  };

  // Show loading placeholder
  if (!isInView && !priority) {
    return (
      <div
        ref={imgRef}
        className={`animate-pulse bg-gradient-to-br from-gray-200 to-gray-300 ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: !fill && width && height ? `${width}/${height}` : undefined
        }}
        aria-label={`Loading image: ${alt}`}
      />
    );
  }

  // Show error state - fallback to Next.js logo with better styling
  if (hasError) {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
        <Image
          src="/next.svg"
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={sizes}
          priority={priority}
          className="transition-opacity duration-300 opacity-100 object-contain p-4"
        />
        {/* Clear overlay to indicate error state */}
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="text-xs text-gray-600 bg-white/90 px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
            Image unavailable
          </div>
        </div>

        {/* Debug info for failed images (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-1 right-1 bg-red-500/80 text-white text-xs px-2 py-1 rounded font-mono">
            ❌ Failed
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } object-cover`}
      />
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 to-gray-300" />
      )}

      {/* Debug info overlay (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
          {retryCount > 0 && `R:${retryCount}`}
          {isRetrying && '🔄'}
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
