import React, { useState } from 'react';
import { Popover, TextInput } from '@mantine/core';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { IconCalendar } from '@tabler/icons-react';
import { Controller, Control } from 'react-hook-form';
import { DATE_DISPLAY_FORMAT } from '@/constants/fees';
import 'react-day-picker/dist/style.css';

interface DatePickerFieldProps {
  name: string;
  label: string;
  control: Control<any>;
  placeholder?: string;
}

/**
 * Reusable date picker component integrated with react-hook-form
 */
export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  name,
  label,
  control,
  placeholder = 'Chọn ngày',
}) => {
  const [calendarOpened, setCalendarOpened] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ 
        fontSize: '14px', 
        fontWeight: 500, 
        marginBottom: '5px' 
      }}>
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Popover 
            opened={calendarOpened} 
            onChange={setCalendarOpened} 
            position="bottom" 
            withinPortal
          >
            <Popover.Target>
              <div 
                style={{ position: 'relative' }}
                onClick={() => setCalendarOpened(true)}
              >
                <TextInput
                  placeholder={placeholder}
                  value={field.value ? format(field.value, DATE_DISPLAY_FORMAT) : ''}
                  readOnly
                  rightSection={<IconCalendar size={16} />}
                  styles={{
                    input: {
                      cursor: 'pointer',
                    }
                  }}
                />
              </div>
            </Popover.Target>
            <Popover.Dropdown>
              <DayPicker
                mode="single"
                selected={field.value || undefined}
                onSelect={(date) => {
                  if (date) {
                    field.onChange(date);
                  } else {
                    field.onChange(null);
                  }
                  setCalendarOpened(false);
                }}
                locale={vi}
                footer={
                  <div 
                    style={{ 
                      cursor: 'pointer', 
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: '#228be6',
                      padding: '5px'
                    }}
                    onClick={() => {
                      field.onChange(null);
                      setCalendarOpened(false);
                    }}
                  >
                    Xoá
                  </div>
                }
              />
            </Popover.Dropdown>
          </Popover>
        )}
      />
    </div>
  );
}; 