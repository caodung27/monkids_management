import { forwardRef } from 'react';
import { Controller, Control } from 'react-hook-form';
import { cn } from '@/libs/utils';

interface AmountInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  control: Control<any>;
  readOnly?: boolean;
  min?: number;
  max?: number;
  error?: string;
}

const CURRENCY_SYMBOL = '₫';
const DECIMAL_SCALE = 0;

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ name, label, control, readOnly = false, min = 0, max, className, error, ...props }, ref) => {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="w-full">
            <label
              htmlFor={name}
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {label}
            </label>
            <div className="relative mt-1">
              <input
                {...field}
                {...props}
                ref={ref}
                type="number"
                id={name}
                min={min}
                max={max}
                readOnly={readOnly}
                className={cn(
                  'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white',
                  error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                  readOnly && 'bg-gray-100 dark:bg-gray-800',
                  className
                )}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value ? Number(value) : 0);
                }}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                  {CURRENCY_SYMBOL}
                </span>
              </div>
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        )}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput'; 