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

  // Show error state - fallback to Next.js logo
  if (hasError) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
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
