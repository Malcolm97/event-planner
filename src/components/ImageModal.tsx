import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FiX, FiZoomIn, FiZoomOut, FiRotateCcw } from 'react-icons/fi';
import { EventItem } from '@/lib/types';

import { getAllImageUrls } from '@/lib/utils';

interface ImageModalProps {
  event: EventItem;
  activeImageIndex: number;
  onClose: () => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  onImageSelect: (index: number) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  event,
  activeImageIndex,
  onClose,
  onPrevImage,
  onNextImage,
  onImageSelect
}) => {
  const allImageUrls = getAllImageUrls(event?.image_urls);
  const hasImages = allImageUrls.length > 0;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle mouse/touch interactions for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPan({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(prev * delta, 3)));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-95 backdrop-blur-md p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="relative w-full max-w-7xl h-full max-h-[95vh] sm:max-h-[90vh] flex items-center justify-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all duration-200 shadow-lg hover:scale-110"
          aria-label="Close Image Viewer"
        >
          <FiX size={24} />
        </button>

        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 z-30 flex gap-2">
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
          className="relative z-10 w-full h-full max-w-full max-h-full overflow-hidden rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
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

        {/* Thumbnail Strip */}
        {allImageUrls.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3 flex-wrap justify-center max-w-full px-2 sm:px-4">
            {allImageUrls.slice(0, 6).map((imageUrl: string, index: number) => (
              <div
                key={index}
                className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2 shadow-lg ${
                  activeImageIndex === index
                    ? 'border-white scale-110 shadow-white/50'
                    : 'border-white/30 hover:border-white/70 hover:scale-105'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageSelect(index);
                }}
              >
                <Image
                  src={imageUrl}
                  alt={`${event?.name} image ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Image Counter and Title */}
        <div className="absolute bottom-20 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 truncate">{event?.name}</h3>
            {allImageUrls.length > 1 && (
              <p className="text-xs sm:text-sm md:text-base text-white/80">
                {activeImageIndex + 1} of {allImageUrls.length} images
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
