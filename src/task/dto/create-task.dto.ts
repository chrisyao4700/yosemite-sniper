// src/task/dto/create-task.dto.ts
import { IsBoolean, IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  campGround: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsBoolean()
  autoBook = true;
}
