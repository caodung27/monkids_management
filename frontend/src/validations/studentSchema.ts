import { z } from 'zod';

/**
 * Schema for student form validation
 */
export const studentSchema = z.object({
  name: z.string().min(1, { message: 'Vui lòng nhập tên học sinh' }),
  classroom: z.string().min(1, { message: 'Vui lòng chọn lớp' }),
  birthdate: z.date().nullable(),
  
  // Fee fields - all should be numbers
  base_fee: z.number().nonnegative({ message: 'Học phí không được âm' }).default(0),
  discount_percentage: z.number().min(0).max(1).default(0),
  final_fee: z.number().nonnegative().default(0),
  utilities_fee: z.number().nonnegative().default(0),
  
  // Meal tickets
  pt: z.number().nonnegative().default(0),
  pm: z.number().nonnegative().default(0),
  meal_fee: z.number().default(0),
  
  // Optional fees
  eng_fee: z.number().nonnegative().default(0),
  skill_fee: z.number().nonnegative().default(0),
  student_fund: z.number().nonnegative().default(0),
  facility_fee: z.number().nonnegative().default(0),
  
  // Payment fields
  total_fee: z.number().default(0),
  paid_amount: z.number().nonnegative().default(0),
  remaining_amount: z.number().default(0),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

// Schema for API payload
export const studentApiSchema = studentSchema.extend({
  birthdate: z.date().nullable().transform(date => 
    date ? date.toISOString().split('T')[0] : null
  ),
  // Transform all number fields to strings for API
  base_fee: z.number().transform(val => String(val)),
  final_fee: z.number().transform(val => String(val)),
  utilities_fee: z.number().transform(val => String(val)),
  pt: z.number().transform(val => String(val)),
  pm: z.number().transform(val => String(val)),
  meal_fee: z.number().transform(val => String(val)),
  eng_fee: z.number().transform(val => String(val)),
  skill_fee: z.number().transform(val => String(val)),
  student_fund: z.number().transform(val => String(val)),
  facility_fee: z.number().transform(val => String(val)),
  total_fee: z.number().transform(val => String(val)),
  paid_amount: z.number().transform(val => String(val)),
  remaining_amount: z.number().transform(val => String(val)),
});

export type StudentApiPayload = z.infer<typeof studentApiSchema>; 