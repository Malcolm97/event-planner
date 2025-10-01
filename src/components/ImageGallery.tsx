import React, { useState } from 'react';
import Image from 'next/image';
import { FiImage } from 'react-icons/fi';
import { getEventPrimaryImage } from '@/lib/utils';
import { EventItem } from '@/lib/types';

interface ImageGalleryProps {
  event: EventItem;
  onImageExpand: (index: number) => void;
}

// Helper function to get all image URLs
const getAllImageUrls = (imageUrls: string[] | string | null | undefined): string[] => {
  if (!imageUrls) return [];

  if (typeof imageUrls === 'string') {
    try {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed : [imageUrls];
    } catch (error) {
      return [imageUrls];
    }
  }

  return Array.isArray(imageUrls) ? imageUrls : [];
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ event, onImageExpand }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const primaryImageUrl = event ? getEventPrimaryImage(event) : '/next.svg';
  const allImageUrls = getAllImageUrls(event?.image_urls);
  const hasImages = allImageUrls.length > 0;

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = '/window.svg';
    setImageLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Primary Image */}
      <div
        className="relative group rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-200/50 bg-gradient-to-br from-gray-50 to-white"
        onClick={() => onImageExpand(0)}
      >
        {/* Loading skeleton */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-3xl" />
        )}

        {/* Loading spinner */}
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
          </div>
        )}

        <Image
          src={hasImages ? allImageUrls[0] : primaryImageUrl}
          alt={event?.name ? `${event.name} main image` : 'Event Image'}
          width={600}
          height={400}
          className="w-full h-80 sm:h-96 md:h-[28rem] lg:h-[32rem] object-cover transition-all duration-700 group-hover:scale-105"
          loading="eager"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
            <FiImage size={28} className="text-gray-700" />
          </div>
        </div>

        {/* Image counter */}
        {hasImages && allImageUrls.length > 1 && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
            1 / {allImageUrls.length}
          </div>
        )}
      </div>

      {/* Additional Images Thumbnails */}
      {hasImages && allImageUrls.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {allImageUrls.slice(1, 6).map((imageUrl: string, index: number) => (
            <div
              key={index}
              className="relative cursor-pointer group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 hover:border-yellow-300 bg-white"
              onClick={() => onImageExpand(index + 1)}
            >
              <Image
                src={imageUrl}
                alt={event?.name ? `${event.name} image ${index + 2}` : `Event image ${index + 2}`}
                width={200}
                height={150}
                className="w-full h-24 sm:h-28 md:h-32 object-cover transition-all duration-300 group-hover:scale-110"
                loading="lazy"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-300">
                  <FiImage size={16} className="text-gray-700" />
                </div>
              </div>

              {/* More images indicator */}
              {index === 4 && allImageUrls.length > 6 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{allImageUrls.length - 6}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
