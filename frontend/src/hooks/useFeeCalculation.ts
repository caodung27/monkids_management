import { useEffect } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { StudentFormValues } from '@/validations/studentSchema';
import { MEAL_FEE_PER_TICKET } from '@/constants/fees';

/**
 * Custom hook for calculating all fee-related values based on form inputs
 */
export const useFeeCalculation = (
  watch: UseFormWatch<StudentFormValues>,
  setValue: UseFormSetValue<StudentFormValues>
) => {
  useEffect(() => {
    const subscription = watch((values, { name }) => {
      // Skip calculation if it's triggered by the calculated fields themselves
      if (
        name === 'final_fee' || 
        name === 'meal_fee' || 
        name === 'total_fee' || 
        name === 'remaining_amount'
      ) {
        return;
      }

      const {
        base_fee = 0,
        discount_percentage = 0,
        utilities_fee = 0,
        pt = 0,
        pm = 0,
        eng_fee = 0,
        skill_fee = 0,
        student_fund = 0,
        facility_fee = 0,
        paid_amount = 0
      } = values;

      // Calculate final fee after discount and round to whole number
      const finalFee = Math.round(base_fee * (1 - discount_percentage));
      setValue('final_fee', finalFee);
      
      // Calculate meal fee and round to whole number
      const mealFee = Math.round((pm - pt) * MEAL_FEE_PER_TICKET);
      setValue('meal_fee', mealFee);
      
      // Calculate total fee and round to whole number
      const totalFee = Math.round(
        finalFee + 
        utilities_fee + 
        mealFee + 
        eng_fee + 
        skill_fee + 
        student_fund + 
        facility_fee
      );
      setValue('total_fee', totalFee);
      
      // Calculate remaining amount and round to whole number
      const remainingAmount = Math.round(totalFee - paid_amount);
      setValue('remaining_amount', remainingAmount);
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);
}; 