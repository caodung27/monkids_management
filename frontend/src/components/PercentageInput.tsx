import React from 'react';
import { NumberInput, NumberInputProps } from '@mantine/core';
import { Controller, Control } from 'react-hook-form';
import { PERCENTAGE_SYMBOL, DECIMAL_SCALE } from '@/constants/fees';

interface PercentageInputProps extends Omit<NumberInputProps, 'onChange'> {
  name: string;
  label: string;
  control: Control<any>;
  min?: number;
  max?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Reusable percentage input component 
 * Stores values in 0-1 range in the form state, but displays as 0-100
 */
export const PercentageInput: React.FC<PercentageInputProps> = ({
  name,
  label,
  control,
  min = 0,
  max = 100,
  placeholder,
  onKeyDown,
  ...rest
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <NumberInput
          {...rest}
          label={label}
          placeholder={placeholder || `Nhập ${label.toLowerCase()}`}
          // Convert from 0-1 to 0-100 for display
          value={(field.value || 0) * 100}
          // Convert back to 0-1 for state
          onChange={(value) => field.onChange((Number(value) || 0) / 100)}
          suffix={PERCENTAGE_SYMBOL}
          decimalScale={DECIMAL_SCALE}
          min={min}
          max={max}
          onKeyDown={onKeyDown}
          error={error?.message}
        />
      )}
    />
  );
}; 