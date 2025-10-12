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
  const imgRef = useRef<HTMLDivElement>(null);

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
    setHasError(true);
    onError?.();
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

  // Show error state
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio: !fill && width && height ? `${width}/${height}` : undefined
        }}
        aria-label={`Failed to load image: ${alt}`}
      >
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs">Image unavailable</p>
        </div>
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
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
