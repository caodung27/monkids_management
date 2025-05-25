import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
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

  @Exclude()
  @Column({ nullable: true })
  password?: string;

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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 