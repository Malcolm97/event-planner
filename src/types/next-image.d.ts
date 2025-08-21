declare module 'next/image' {
  import * as React from 'react';

  type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    fill?: boolean; // Use fill prop instead of layout="fill"
    objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
    objectPosition?: string;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    quality?: number;
    sizes?: string;
    unoptimized?: boolean;
    // Add any other props that might be used by next/image
  };

  export default function Image(props: ImageProps): React.ReactElement;
}
