import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteDto {
  @ApiProperty({ type: [String], description: 'Array of student IDs to delete' })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
} 