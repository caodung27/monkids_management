import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty({ description: 'Teacher name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Teacher role', example: 'Quản lý, GV' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: 'Phone number',
    example: '0123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Base salary', example: '6500000.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  base_salary?: number;

  @ApiProperty({ description: 'Teaching days', example: 24 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  teaching_days?: number;

  @ApiProperty({ description: 'Absence days', example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  absence_days?: number;

  @ApiProperty({ description: 'Received salary', example: '6500000.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  received_salary?: number;

  @ApiProperty({ description: 'Extra teaching days', example: 1 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  extra_teaching_days?: number;

  @ApiProperty({ description: 'Extra salary', example: '150000.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  extra_salary?: number;

  @ApiProperty({ description: 'Insurance support', example: '500000.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  insurance_support?: number;

  @ApiProperty({ description: 'Responsibility support', example: '2000000.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  responsibility_support?: number;

  @ApiProperty({ description: 'Breakfast support', example: '0.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  breakfast_support?: number;

  @ApiProperty({ description: 'Skill sessions', example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  skill_sessions?: number;

  @ApiProperty({ description: 'Skill salary', example: '0.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  skill_salary?: number;

  @ApiProperty({ description: 'English sessions', example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  english_sessions?: number;

  @ApiProperty({ description: 'English salary', example: '0.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  english_salary?: number;

  @ApiProperty({
    description: 'New students list',
    example: '0',
    required: false,
  })
  @IsString()
  @IsOptional()
  new_students_list?: string;

  @ApiProperty({ description: 'Paid amount', example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paid_amount?: number;

  @ApiProperty({ description: 'Total salary', example: '9150000.00' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  total_salary?: number;

  @ApiProperty({ description: 'Note', example: null, required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
