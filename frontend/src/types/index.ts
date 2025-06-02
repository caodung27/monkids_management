export interface Student {
  student_id: number;
  sequential_number: string;
  name: string;
  classroom: string;
  birthdate: string | null;
  base_fee: number;
  discount_percentage: number;
  final_fee: number;
  utilities_fee: number;
  pt: number;
  pm: number;
  meal_fee: number;
  eng_fee: number;
  skill_fee: number;
  student_fund: number;
  facility_fee: number;
  total_fee: number;
  paid_amount: number;
  remaining_amount: number;
  note: string;
}

export interface Teacher {
  teacher_no: number;
  id: string;
  name: string;
  role: string;
  phone: string | null;
  base_salary: number;
  teaching_days: number;
  absence_days: number; 
  received_salary: number;
  extra_teaching_days: number;
  extra_salary: number;
  probation_days: number;
  probation_salary: number;
  insurance_support: number;
  responsibility_support: number;
  breakfast_support: number;
  skill_sessions: number;
  skill_salary: number;
  english_sessions: number;
  english_salary: number;
  new_students_list: number;
  total_salary: number;
  paid_amount: number;
  note: string;
}

export interface StudentApiUpdatePayload {
  name: string;
  classroom: string;
  birthdate: string | null;
  base_fee: number;
  discount_percentage: number;
  final_fee: number;
  utilities_fee: number;
  pt: number;
  pm: number;
  meal_fee: number;
  eng_fee: number;
  skill_fee: number;
  student_fund: number;
  facility_fee: number;
  paid_amount: number;
  total_fee: number;
  remaining_amount: number;
} 

export interface TeacherApiPayload {
  name: string;
  role: string;
  phone?: string | null;
  base_salary: string;
  teaching_days: number;
  absence_days: number;
  received_salary: string;
  extra_teaching_days: number;
  extra_salary: string;
  probation_days: number;
  probation_salary: string;
  insurance_support: string;
  responsibility_support: string;
  breakfast_support: string;
  skill_sessions: number;
  skill_salary: string;
  english_sessions: number;
  english_salary: string;
  new_students_list: string;
  paid_amount: string;
  total_salary: string;
  note?: string | null;
}

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  image: string | null;
  role: string;
  account_type?: string;
  is_active?: boolean;
  password?: string;
};

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  timeout?: number;
}

export interface UiState {
  notifications: Notification[];
  isDrawerOpen: boolean;
}

export interface GenerateMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogOptions {
  level?: LogLevel;
  context?: string;
  data?: any;
}

export type CreateTeacherDto = Omit<Teacher, 'id' | 'created_at' | 'updated_at'>;
export type UpdateTeacherDto = Partial<CreateTeacherDto>;
