import { IsInt, IsObject, Max, Min, ValidateNested } from 'class-validator';

export class UpdateStepDto {
  @IsInt()
  @Min(1)
  @Max(4)
  step!: number;

  @IsObject()
  @ValidateNested()
  data!: Record<string, unknown>;
}
