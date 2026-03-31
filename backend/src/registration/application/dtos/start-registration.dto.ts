import { IsEmail, IsNotEmpty } from 'class-validator';

export class StartRegistrationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
