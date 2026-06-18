import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSeccionDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;
}
