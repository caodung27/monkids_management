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
  base_fee: string;
  discount_percentage: number;
  final_fee: string;
  utilities_fee: string;
  pt: string;
  pm: string;
  meal_fee: string;
  eng_fee: string;
  skill_fee: string;
  student_fund: string;
  facility_fee: string;
  paid_amount: string;
  total_fee: string;
  remaining_amount: string;
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
