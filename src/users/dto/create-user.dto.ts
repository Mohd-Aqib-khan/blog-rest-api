// src/users/dto/create-user.dto.ts

import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsBoolean,
  IsOptional,
  IsEmpty,
} from 'class-validator';

export enum SubscriptionType {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export class CreateUserDto {
  @IsString()
  @IsEmpty()
  provider: string;

  @IsString()
  @IsEmpty()
  providerId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(SubscriptionType)
  @IsNotEmpty()
  subscriptionType: SubscriptionType;

  @IsDate()
  @IsNotEmpty()
  subscriptionEnd: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
