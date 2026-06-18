import { IsString, IsNotEmpty } from 'class-validator';

export class CreateGradoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;
}
