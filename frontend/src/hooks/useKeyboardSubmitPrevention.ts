import { useCallback } from 'react';

/**
 * Hook to prevent form submission when pressing Enter in input fields
 */
export const useKeyboardSubmitPrevention = () => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }, []);

  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>, onSubmit: () => void) => {
    e.preventDefault();
    onSubmit();
  }, []);

  return {
    handleKeyDown,
    handleFormSubmit
  };
}; 