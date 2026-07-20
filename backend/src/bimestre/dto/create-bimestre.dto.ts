import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateBimestreDto {
  @IsInt()
  @IsNotEmpty()
  id_periodo!: number;

  @IsString()
  @IsNotEmpty()
  nombre!: string;
}
