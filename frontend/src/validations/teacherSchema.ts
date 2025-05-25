import { z } from 'zod';

/**
 * Schema for teacher form validation
 */
export const teacherSchema = z.object({
  teacher_no: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number().nonnegative({ message: 'Mã số giáo viên không được âm' }).optional()
  ), // Handle empty string from input as undefined, then validate as number
  name: z.string().min(1, { message: 'Vui lòng nhập tên giáo viên' }),
  role: z.string().min(1, { message: 'Vui lòng nhập chức vụ' }), // Assuming single string input for form
  phone: z.string().nullable(),
  base_salary: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative({ message: 'Lương cơ bản không được âm' }).default(0)
  ),
  teaching_days: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative({ message: 'Số ngày dạy không được âm' }).default(0)
  ),
  absence_days: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative({ message: 'Số ngày nghỉ không được âm' }).default(0)
  ),
  received_salary: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  extra_teaching_days: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative({ message: 'Số ngày dạy thêm không được âm' }).default(0)
  ),
  extra_salary: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  insurance_support: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  responsibility_support: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  breakfast_support: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  skill_sessions: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  skill_salary: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  english_sessions: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  english_salary: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ),
  new_students_list: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative().default(0)
  ), // Assuming number as per Teacher interface
  paid_amount: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().nonnegative({ message: 'Số tiền đã ứng không được âm' }).default(0)
  ),
  total_salary: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().default(0)
  ),
  note: z.string().nullable(),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;

// Schema for API payload - currency fields are strings, others match form schema
export const teacherApiSchema = teacherSchema.extend({
  // Transform numeric currency fields to strings for API payload
  base_salary: z.number().transform(val => val.toString()),
  received_salary: z.number().transform(val => val.toString()),
  extra_salary: z.number().transform(val => val.toString()),
  insurance_support: z.number().transform(val => val.toString()),
  responsibility_support: z.number().transform(val => val.toString()),
  breakfast_support: z.number().transform(val => val.toString()),
  skill_salary: z.number().transform(val => val.toString()),
  english_salary: z.number().transform(val => val.toString()),
  new_students_list: z.number().transform(val => val.toString()),
  paid_amount: z.number().transform(val => val.toString()),
  total_salary: z.number().transform(val => val.toString()),
  // Transform role string from form to string[] for API
  role: z.string().transform(val => val.split(',').map(r => r.trim())),
});

// For create API payload, teacher_no and id are omitted
export const createTeacherApiSchema = teacherApiSchema.omit({
  teacher_no: true, // Assuming backend generates teacher_no on create
  // id: true, // Assuming id is not part of the create payload
});

export type TeacherApiPayload = z.infer<typeof teacherApiSchema>;
export type CreateTeacherApiPayload = z.infer<typeof createTeacherApiSchema>; 