'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { FiUpload, FiX, FiImage, FiAlertCircle, FiCheck, FiCalendar, FiMapPin, FiTag, FiDollarSign, FiFileText } from 'react-icons/fi';

interface ImageUploadProps {
  images: File[];
  existingImages: string[];
  onImagesChange: (files: File[]) => void;
  onExistingImagesRemove: (url: string) => void;
  maxImages?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 5;

export default function ImageUpload({
  images,
  existingImages,
  onImagesChange,
  onExistingImagesRemove,
  maxImages = 3,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<string[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previewsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Sync previews with images
  useEffect(() => {
    const newPreviews = images.map(file => URL.createObjectURL(file));
    previewsRef.current.forEach(url => URL.revokeObjectURL(url));
    previewsRef.current = newPreviews;
    setPreviews(newPreviews);
  }, [images]);

  const totalImages = images.length + existingImages.length;
  const remainingSlots = maxImages - totalImages;

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: JPG, PNG, GIF, WebP`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    setError(null);
    const fileArray = Array.from(files);
    
    if (fileArray.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more image(s)`);
      return;
    }

    // Validate all files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onImagesChange([...images, ...fileArray]);
  }, [images, remainingSlots, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value to allow selecting same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleRemoveNew = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleRemoveExisting = useCallback((url: string) => {
    onExistingImagesRemove(url);
  }, [onExistingImagesRemove]);

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <FiAlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Current images:</p>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={url}
                    alt={`Event image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 100px"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  title="Remove image"
                  aria-label={`Remove image ${index + 1}`}
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Image Previews */}
      {previews.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">New images to upload:</p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((previewUrl, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={previewUrl}
                    alt={`New image ${index + 1}`}
                    className="object-cover w-full h-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNew(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                  title="Remove image"
                  aria-label={`Remove new image ${index + 1}`}
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {remainingSlots > 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
            ${isDragging 
              ? 'border-yellow-400 bg-yellow-50' 
              : 'border-gray-300 hover:border-yellow-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Upload event images"
          />
          
          <div className="flex flex-col items-center gap-2">
            <div className={`
              p-3 rounded-full transition-colors
              ${isDragging ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}
            `}>
              <FiImage size={24} />
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">
                Click to upload
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-400">
              {remainingSlots} image{remainingSlots > 1 ? 's' : ''} remaining • JPG, PNG, GIF, WebP • Max {maxSizeMB}MB each
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-500">
          Maximum of {maxImages} images reached
        </div>
      )}

      {/* Image Count */}
      {totalImages > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {totalImages} of {maxImages} images
        </p>
      )}
    </div>
  );
}

// Form Section Component
interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, icon, children, className = '' }: FormSectionProps) {
  return (
    <div className={`
      bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 p-6
      shadow-sm hover:shadow-md transition-shadow duration-200
      ${className}
    `}>
      <div className="flex items-center gap-3 mb-4">
        {icon && (
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-red-500 rounded-lg text-white">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// Form Field Component
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <FiAlertCircle size={14} />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

// Loading Button Component
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      className={`
        w-full rounded-xl px-6 py-3.5 font-semibold
        bg-gradient-to-r from-yellow-400 to-red-500 text-white
        hover:from-yellow-500 hover:to-red-600
        focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          <span>{loadingText || 'Loading...'}</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

// Alert Banner Component
interface AlertBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const alertStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconSizes = {
  success: FiCheck,
  error: FiAlertCircle,
  warning: FiAlertCircle,
  info: FiImage,
};

export function AlertBanner({ type, message, icon, onClose }: AlertBannerProps) {
  const Icon = iconSizes[type];
  
  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${alertStyles[type]}`}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Close"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, children }: PageHeaderProps) {
  return (
    <div className="text-center mb-8">
      {icon && (
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          {icon}
        </div>
      )}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-gray-600">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
