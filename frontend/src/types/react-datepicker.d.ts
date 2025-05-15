declare module 'react-datepicker' {
  import React from 'react';
  
  interface DatePickerProps {
    selected?: Date | null;
    onChange?: (date: Date | null) => void;
    dateFormat?: string;
    locale?: string;
    placeholderText?: string;
    maxDate?: Date;
    showMonthDropdown?: boolean;
    showYearDropdown?: boolean;
    dropdownMode?: string;
    isClearable?: boolean;
    customInput?: React.ReactElement;
    className?: string;
    [key: string]: any;
  }
  
  const DatePicker: React.FC<DatePickerProps>;
  
  export default DatePicker;
  export function registerLocale(localeName: string, localeData: any): void;
} 