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
      className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 shadow-lg ${
        isActive
          ? 'border-white scale-110 shadow-white/50'
          : 'border-white/30 hover:border-white/70 hover:scale-105'
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
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!hasImages) return null;

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
      className="fixed inset-0 z-[110] bg-black bg-opacity-95 backdrop-blur-md pt-16 sm:pt-20 lg:pt-24 pb-32 sm:pb-36 lg:pb-4 animate-fade-in flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Top Controls Bar */}
        <div className="flex-shrink-0 flex justify-between items-center p-4 z-30">
          {/* Zoom Controls */}
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              className="p-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all duration-200 shadow-lg hover:scale-110"
              aria-label="Zoom Out"
            >
              <FiZoomOut size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
              className="px-4 py-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all duration-200 shadow-lg hover:scale-110 text-sm font-medium"
              aria-label="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              className="p-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all duration-200 shadow-lg hover:scale-110"
              aria-label="Zoom In"
            >
              <FiZoomIn size={20} />
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all duration-200 shadow-lg hover:scale-110"
            aria-label="Close Image Viewer"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Main Image Area */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Navigation Buttons */}
          <button
            onClick={(e) => { e.stopPropagation(); onPrevImage(); }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white p-4 rounded-full transition-all duration-200 z-20 shadow-lg hover:scale-110"
            aria-label="Previous Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Main Image Container */}
          <div
            ref={containerRef}
            className="relative w-full max-w-5xl h-full max-h-[75vh] lg:max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing"
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
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white p-4 rounded-full transition-all duration-200 z-20 shadow-lg hover:scale-110"
            aria-label="Next Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Bottom UI Section */}
        <div className="flex-shrink-0 z-30">
          {/* Image Counter and Title */}
          <div className="px-4 pb-3 lg:pb-6">
            <div className="bg-gradient-to-r from-black/70 via-black/60 to-black/70 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl mx-auto max-w-lg border border-white/10">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 truncate text-center text-white leading-tight">{event?.name}</h3>
              {allImageUrls.length > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex gap-1">
                    {allImageUrls.slice(0, 5).map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === activeImageIndex % 5 ? 'bg-white scale-125' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-white/90 font-medium ml-2">
                    {activeImageIndex + 1} / {allImageUrls.length}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {allImageUrls.length > 1 && (
            <div className="px-4 pb-6 lg:pb-8">
              <div className="flex gap-3 sm:gap-4 flex-wrap justify-center max-w-4xl mx-auto">
                {allImageUrls.slice(0, 8).map((imageUrl: string, index: number) => (
                  <ThumbnailItem
                    key={index}
                    src={imageUrl}
                    alt={`${event?.name} image ${index + 1}`}
                    isActive={activeImageIndex === index}
                    onClick={() => onImageSelect(index)}
                  />
                ))}
                {allImageUrls.length > 8 && (
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-black/60 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">+{allImageUrls.length - 8}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
