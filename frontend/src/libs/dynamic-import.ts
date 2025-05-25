import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { DynamicOptionsLoadingProps } from 'next/dynamic';

export function dynamicImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: (props: DynamicOptionsLoadingProps) => JSX.Element | null;
    ssr?: boolean;
  } = {}
) {
  return dynamic(importFn, {
    loading: options.loading,
    ssr: options.ssr ?? true,
  });
} 