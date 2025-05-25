import { Metadata } from 'next';
import { GenerateMetadataOptions } from '@/types';

export function generateMetadata({
  title,
  description,
  keywords = [],
  ogImage,
  noIndex = false,
}: GenerateMetadataOptions): Metadata {
  const siteName = 'Monkid Management';
  const fullTitle = `${title} | ${siteName}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'Monkid Management' }],
    openGraph: {
      title: fullTitle,
      description,
      siteName,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
} 