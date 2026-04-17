import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegistrationProfileDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @Type(() => Date)
  @IsDate()
  birthDate!: Date;

  @IsString()
  @IsNotEmpty()
  cep!: string;

  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;
}
