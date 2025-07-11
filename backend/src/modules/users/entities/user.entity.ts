import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  TEACHER = 'TEACHER',
}

@Entity('app_user')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ length: 100 })
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column({ length: 20, nullable: true })
  phone: string;

  @ApiProperty()
  @Column({ length: 200, nullable: true })
  address: string;

  @ApiProperty()
  @Column({ length: 200, nullable: true })
  image: string;

  @ApiProperty()
  @Column({ length: 20, default: 'LOCAL' })
  account_type: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    length: 10,
    default: UserRole.USER
  })
  role: UserRole;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @Column({ length: 100, nullable: true })
  code_id: string;

  @ApiProperty()
  @Column({ nullable: true })
  code_expired: Date;

  @ApiProperty()
  @Exclude()
  @Column({ length: 255, nullable: false })
  password: string;

  @CreateDateColumn({ type: 'timestamp', nullable: false, default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false, default: () => 'now()' })
  updated_at: Date;
} 