import NextImage, { ImageProps as NextImageProps } from 'next/image';
import { cn } from '@/libs/utils';

interface ImageProps extends Omit<NextImageProps, 'alt'> {
  alt: string;
  className?: string;
}

export function Image({ className, ...props }: ImageProps) {
  return (
    <NextImage
      className={cn('object-cover', className)}
      loading="lazy"
      quality={75}
      {...props}
    />
  );
} 