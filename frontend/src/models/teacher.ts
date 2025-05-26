export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateTeacherDto extends Partial<CreateTeacherDto> {
  id: string;
} 