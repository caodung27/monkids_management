-- Thêm cột mới vào bảng app_teacher
ALTER TABLE public.app_teacher
ADD COLUMN probation_days INTEGER NOT NULL DEFAULT 0,
ADD COLUMN probation_salary NUMERIC(10,2) NOT NULL DEFAULT 0;
