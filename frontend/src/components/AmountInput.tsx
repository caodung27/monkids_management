import React from 'react';
import { NumberInput, NumberInputProps } from '@mantine/core';
import { Controller, Control } from 'react-hook-form';
import { CURRENCY_SYMBOL, DECIMAL_SCALE } from '@/constants/fees';

interface AmountInputProps extends Omit<NumberInputProps, 'onChange'> {
  name: string;
  label: string;
  control: Control<any>;
  readOnly?: boolean;
  min?: number;
  max?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Reusable amount input component for monetary values
 */
export const AmountInput: React.FC<AmountInputProps> = ({
  name,
  label,
  control,
  readOnly = false,
  min = 0,
  max,
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
          value={field.value}
          onChange={(value) => field.onChange(Number(value) || 0)}
          suffix={CURRENCY_SYMBOL}
          thousandSeparator=","
          decimalScale={DECIMAL_SCALE}
          min={min}
          max={max}
          readOnly={readOnly}
          onKeyDown={onKeyDown}
          error={error?.message}
        />
      )}
    />
  );
}; 