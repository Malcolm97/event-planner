import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiZoomIn, FiZoomOut, FiRotateCcw } from 'react-icons/fi';
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
      className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
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

  // All hooks must be called before any conditional returns
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine the current image URL and alt text
  let currentImageUrl = '';
  let currentImageAlt = 'Event Image';

  if (allImageUrls.length > 0) {
    const safeIndex = activeImageIndex % allImageUrls.length;
    currentImageUrl = allImageUrls[safeIndex];
    currentImageAlt = event?.name ? `${event.name} image ${safeIndex + 1}` : 'Event Image';
  }

  // Reset zoom and pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageLoading(true);
    setImageError(false);
  }, [activeImageIndex]);

  // Handle zoom controls with bounds checking
  const handleZoomIn = () => {
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
  };

  const handleZoomOut = () => {
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
  };

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

      // Account for header area and modal padding - create generous upward pan limit
      // Use dynamic restriction based on zoom level for better UX
      const headerHeight = 80;
      const modalTopPadding = window.innerWidth >= 1024 ? 96 : 80; // lg:pt-24 = 96px
      const totalRestriction = headerHeight + modalTopPadding * 0.5; // Conservative restriction
      const safeMaxPanY = Math.max(0, maxPanY - totalRestriction);

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPan(prevPan => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prevPan.x + deltaX)),
        y: Math.max(-safeMaxPanY, Math.min(maxPanY, prevPan.y + deltaY))
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
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
  }, [onClose, onPrevImage, onNextImage]);

  return (
    <div
      className="fixed inset-x-0 top-14 sm:top-16 md:top-20 lg:top-0 bottom-0 z-[110] bg-black/95 backdrop-blur-md animate-fade-in flex flex-col"
      onClick={onClose}
    >
      {/* Top Controls Bar - Fixed at top */}
      <div className="flex-shrink-0 flex justify-between items-center p-3 sm:p-4 md:p-5">
        {/* Left side - Zoom Controls */}
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="p-2 sm:p-2.5 rounded-full bg-black/70 backdrop-blur-lg text-white hover:bg-black/80 transition-all duration-200 shadow-lg"
            aria-label="Zoom Out"
          >
            <FiZoomOut size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-black/70 backdrop-blur-lg text-white hover:bg-black/80 transition-all duration-200 text-sm font-medium shadow-lg"
            aria-label="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="p-2 sm:p-2.5 rounded-full bg-black/70 backdrop-blur-lg text-white hover:bg-black/80 transition-all duration-200 shadow-lg"
            aria-label="Zoom In"
          >
            <FiZoomIn size={18} />
          </button>
        </div>

        {/* Right side - Close button - always visible */}
        <button
          onClick={onClose}
          className="p-2.5 sm:p-3 md:p-3.5 rounded-full bg-black/80 backdrop-blur-xl text-white hover:bg-yellow-500 hover:text-black transition-all duration-200 shadow-xl border-2 border-white/20 hover:border-yellow-400"
          aria-label="Close Image Viewer"
        >
          <FiX size={22} className="sm:size-24 md:size-26" />
        </button>
      </div>

      {/* Main Image Area - Takes remaining space */}
      <div className="flex-1 relative flex items-center justify-center px-12 sm:px-16 md:px-20 lg:px-24 w-full min-h-0">
        {/* Navigation Buttons - visible on tablet+ */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-lg hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 z-20 shadow-lg"
          aria-label="Previous Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main Image Container */}
        <div
          ref={containerRef}
          className="relative w-full h-full max-h-full overflow-hidden rounded-lg sm:rounded-xl shadow-2xl cursor-grab active:cursor-grabbing"
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
          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/70 backdrop-blur-lg hover:bg-black/80 text-white p-2 sm:p-3 rounded-full transition-all duration-200 z-20 shadow-lg"
          aria-label="Next Image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom UI Section - Fixed at bottom with spacing for mobile nav */}
      <div className="flex-shrink-0 p-3 sm:p-4 pb-16 sm:pb-6 md:pb-4">
        {/* Image Counter */}
        <div className="bg-gradient-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-md rounded-xl px-4 py-2 mx-auto max-w-md border border-white/10 mb-3">
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs sm:text-sm text-white/90 font-medium">
              {activeImageIndex + 1} / {allImageUrls.length}
            </p>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {allImageUrls.length > 1 && (
          <div className="flex gap-2 justify-center max-w-2xl mx-auto">
            {allImageUrls.slice(0, 6).map((imageUrl: string, index: number) => (
              <ThumbnailItem
                key={index}
                src={imageUrl}
                alt={`${event?.name} image ${index + 1}`}
                isActive={activeImageIndex === index}
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
