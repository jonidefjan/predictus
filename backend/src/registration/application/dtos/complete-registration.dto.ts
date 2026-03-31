import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CompleteRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
