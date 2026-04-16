import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { EventItem } from '@/lib/types';

import { getValidImageUrls } from '@/lib/utils';

interface ImageModalProps {
  event: EventItem;
  activeImageIndex: number;
  onClose: () => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  onImageSelect: (index: number) => void;
}

interface ThumbnailItemProps {
  src: string;
  alt: string;
  isActive: boolean;
  onClick: () => void;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({ src, alt, isActive, onClick }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
        isActive
          ? 'border-white scale-105 shadow-white/50'
          : 'border-white/30 hover:border-white/70'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Loading skeleton */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-lg" />
      )}

      {/* Error state */}
      {imageError && !imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-600 rounded-lg">
          <div className="text-center text-white">
            <div className="text-xs">❌</div>
          </div>
        </div>
      )}

      {!imageError && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
      )}
    </div>
  );
};

const ImageModal: React.FC<ImageModalProps> = ({
  event,
  activeImageIndex,
  onClose,
  onPrevImage,
  onNextImage,
  onImageSelect
}) => {
  const allImageUrls = getValidImageUrls(event?.image_urls);
  const hasImages = allImageUrls.length > 0;
  const clampedImageIndex = hasImages
    ? Math.max(0, Math.min(activeImageIndex, allImageUrls.length - 1))
    : 0;

  // All hooks must be called before any conditional returns
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchLastRef = useRef({ x: 0, y: 0 });
  const touchActionRef = useRef<'swipe' | 'pan' | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Determine the current image URL and alt text
  let currentImageUrl = '';
  let currentImageAlt = 'Event Image';

  if (allImageUrls.length > 0) {
    const safeIndex = clampedImageIndex;
    currentImageUrl = allImageUrls[safeIndex];
    currentImageAlt = event?.name ? `${event.name} image ${safeIndex + 1}` : 'Event Image';
  }

  // Reset zoom and pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageLoading(true);
    setImageError(false);
  }, [clampedImageIndex]);

  // Handle zoom controls with bounds checking
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const oldZoom = prev;
      const newZoom = Math.min(prev * 1.2, 3);
      // Adjust pan to center on cursor position
      if (newZoom !== 1 && oldZoom !== 1) {
        setPan(currentPan => ({
          x: currentPan.x + mousePos.x * (1 - newZoom / oldZoom),
          y: currentPan.y + mousePos.y * (1 - newZoom / oldZoom)
        }));
      } else if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, [mousePos.x, mousePos.y]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const oldZoom = prev;
      const newZoom = Math.max(prev / 1.2, 0.5);
      // Adjust pan to center on cursor position
      if (newZoom !== 1 && oldZoom !== 1) {
        setPan(currentPan => ({
          x: currentPan.x + mousePos.x * (1 - newZoom / oldZoom),
          y: currentPan.y + mousePos.y * (1 - newZoom / oldZoom)
        }));
      } else if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, [mousePos.x, mousePos.y]);

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle mouse/touch interactions for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1 && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;

      // Calculate maximum pan limits based on zoom level
      const maxPanX = (containerWidth * (zoom - 1)) / 2;
      const maxPanY = (containerHeight * (zoom - 1)) / 2;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPan(prevPan => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prevPan.x + deltaX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prevPan.y + deltaY))
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) {
      return;
    }

    const point = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchStartRef.current = point;
    touchLastRef.current = point;
    touchActionRef.current = null;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) {
      return;
    }

    const currentPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const deltaXFromStart = currentPoint.x - touchStartRef.current.x;
    const deltaYFromStart = currentPoint.y - touchStartRef.current.y;

    if (!touchActionRef.current) {
      touchActionRef.current = Math.abs(deltaXFromStart) > Math.abs(deltaYFromStart) ? 'swipe' : 'pan';
    }

    // Prioritize pan when zoomed in for precise image control.
    if (zoom > 1) {
      touchActionRef.current = 'pan';
    }

    if (touchActionRef.current === 'pan' && zoom > 1 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const maxPanX = (containerWidth * (zoom - 1)) / 2;
      const maxPanY = (containerHeight * (zoom - 1)) / 2;

      const deltaX = currentPoint.x - touchLastRef.current.x;
      const deltaY = currentPoint.y - touchLastRef.current.y;

      setPan(prevPan => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prevPan.x + deltaX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prevPan.y + deltaY))
      }));
      setIsDragging(true);
      e.preventDefault();
    }

    touchLastRef.current = currentPoint;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoom <= 1 && touchActionRef.current === 'swipe' && allImageUrls.length > 1) {
      const endX = e.changedTouches[0]?.clientX ?? touchLastRef.current.x;
      const deltaX = endX - touchStartRef.current.x;
      const swipeThreshold = 50;

      if (Math.abs(deltaX) >= swipeThreshold) {
        if (deltaX < 0) {
          onNextImage();
        } else {
          onPrevImage();
        }
      }
    }

    touchActionRef.current = null;
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => {
      const oldZoom = prev;
      const newZoom = Math.max(0.5, Math.min(prev * delta, 3));
      // Adjust pan to center on cursor position
      if (newZoom !== 1 && oldZoom !== 1) {
        setPan(currentPan => ({
          x: currentPan.x + mousePos.x * (1 - newZoom / oldZoom),
          y: currentPan.y + mousePos.y * (1 - newZoom / oldZoom)
        }));
      } else if (newZoom === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNextImage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevImage, onNextImage, handleZoomIn, handleZoomOut]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
      aria-describedby="image-modal-desc"
      className="fixed inset-0 z-[130] bg-black/95 backdrop-blur-md animate-fade-in flex flex-col"
      onClick={onClose}
    >
      <h2 id="image-modal-title" className="sr-only">Image viewer</h2>
      <p id="image-modal-desc" className="sr-only">
        View event images in fullscreen. Use arrow keys to switch images, plus and minus to zoom, and Escape to close.
      </p>
      {/* Top Controls Bar - Fixed at top */}
      <div className="animate-control-in flex-shrink-0 flex justify-between items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 md:px-5 lg:px-6 lg:py-5 bg-gradient-to-b from-black/45 to-transparent">
        {/* Left side - Zoom Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="touch-target rounded-full bg-black/70 backdrop-blur-lg text-white hover:bg-black/80 transition-all duration-200 shadow-lg"
            aria-label="Zoom Out"
          >
            <FiZoomOut size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
            className="touch-target rounded-full px-3 sm:px-4 bg-black/70 backdrop-blur-lg text-white hover:bg-black/80 transition-all duration-200 text-sm font-medium shadow-lg"
            aria-label="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="touch-target rounded-full bg-black/70 backdrop-blur-lg text-white hover:bg-black/80 transition-all duration-200 shadow-lg"
            aria-label="Zoom In"
          >
            <FiZoomIn size={18} />
          </button>
        </div>

        {/* Right side - Close button - always visible */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="touch-target-md rounded-full bg-black/80 backdrop-blur-xl text-white hover:bg-yellow-500 hover:text-black transition-all duration-200 shadow-xl border-2 border-white/20 hover:border-yellow-400"
          aria-label="Close Image Viewer"
        >
          <FiX size={22} className="sm:size-24 md:size-26" />
        </button>
      </div>

      {/* Main Image Area - Takes remaining space, reduced height on desktop by 10% */}
      {hasImages ? (
      <div className="flex-1 relative flex items-center justify-center px-4 sm:px-16 md:px-20 lg:px-24 py-3 sm:py-4 lg:py-8 w-full min-h-0">
        {/* Navigation Buttons - visible on tablet+ */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
          disabled={allImageUrls.length <= 1}
          className={`absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 touch-target rounded-full backdrop-blur-lg text-white transition-all duration-200 z-20 shadow-lg ${
            allImageUrls.length <= 1 ? 'bg-black/35 opacity-40 cursor-not-allowed' : 'bg-black/70 hover:bg-black/80'
          }`}
          aria-label="Previous Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main Image Container */}
        <div
          ref={containerRef}
          className="relative w-full h-full max-h-full overflow-hidden rounded-2xl sm:rounded-[1.75rem] shadow-2xl ring-1 ring-white/10 bg-black/20 cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={(e) => {
            // Track mouse position for zoom centering
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setMousePos({
                x: e.clientX - rect.left - rect.width / 2,
                y: e.clientY - rect.top - rect.height / 2
              });
            }
            handleMouseMove(e);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
        >
            {/* Loading State */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
              </div>
            )}

            {/* Error State */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-lg font-medium">Failed to load image</p>
                  <p className="text-sm text-gray-400 mt-2">Please try again later</p>
                </div>
              </div>
            )}

            {/* Main Image */}
            {!imageError && (
              <img
                ref={imageRef}
                src={currentImageUrl}
                alt={currentImageAlt}
                className={`w-full h-full object-contain transition-transform duration-200 ease-out ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: 'center center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                draggable={false}
              />
            )}
          </div>

        <button
          onClick={(e) => { e.stopPropagation(); onNextImage(); }}
          disabled={allImageUrls.length <= 1}
          className={`absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 touch-target rounded-full backdrop-blur-lg text-white transition-all duration-200 z-20 shadow-lg ${
            allImageUrls.length <= 1 ? 'bg-black/35 opacity-40 cursor-not-allowed' : 'bg-black/70 hover:bg-black/80'
          }`}
          aria-label="Next Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="text-center text-white bg-white/5 border border-white/10 rounded-[1.75rem] px-8 py-10 backdrop-blur-sm shadow-2xl animate-modal-in">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg font-medium">No images available</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="mt-4 touch-target px-5 rounded-full bg-white/90 text-gray-900 font-semibold hover:bg-white transition-colors"
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

      {/* Bottom UI Section - Fixed at bottom with spacing for mobile nav */}
      <div className="animate-control-in flex-shrink-0 px-3 pt-2 pb-4 sm:px-4 sm:pt-3 sm:pb-5 md:pb-4 lg:px-6 lg:pb-6 bg-gradient-to-t from-black/55 to-transparent">
        {/* Image Counter */}
        <div className="bg-gradient-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-md rounded-xl px-4 py-2 mx-auto max-w-md border border-white/10 mb-3">
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs sm:text-sm text-white/90 font-medium">
              {hasImages ? clampedImageIndex + 1 : 0} / {allImageUrls.length}
            </p>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {allImageUrls.length > 1 && (
          <div className="flex gap-2 justify-center max-w-2xl mx-auto overflow-x-auto pb-1 scrollbar-hide">
            {allImageUrls.slice(0, 6).map((imageUrl: string, index: number) => (
              <ThumbnailItem
                key={index}
                src={imageUrl}
                alt={`${event?.name} image ${index + 1}`}
                isActive={clampedImageIndex === index}
                onClick={() => onImageSelect(index)}
              />
            ))}
            {allImageUrls.length > 6 && (
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-black/60 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                <span className="text-white text-xs font-bold">+{allImageUrls.length - 6}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;