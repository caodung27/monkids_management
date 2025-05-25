import { forwardRef, useState } from 'react';
import { Controller, Control } from 'react-hook-form';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { cn } from '@/libs/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface DatePickerFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  control: Control<any>;
  placeholder?: string;
  error?: string;
}

const DATE_DISPLAY_FORMAT = 'dd/MM/yyyy';

export const DatePickerField = forwardRef<HTMLInputElement, DatePickerFieldProps>(
  ({ name, label, control, placeholder = 'Chọn ngày', className, error, ...props }, ref) => {
    const [open, setOpen] = useState(false);

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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground',
                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                    className
                  )}
                  ref={ref}
                  {...props}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {field.value ? (
                    format(field.value, DATE_DISPLAY_FORMAT)
                  ) : (
                    <span>{placeholder}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    setOpen(false);
                  }}
                  locale={vi}
                  initialFocus
                />
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      field.onChange(null);
                      setOpen(false);
                    }}
                  >
                    Xoá
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {error && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        )}
      />
    );
  }
);

DatePickerField.displayName = 'DatePickerField'; 