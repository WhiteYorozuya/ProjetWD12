import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  taille: number = 25;
}

export interface Page<T> {
  elements: T[];
  total: number;
  page: number;
  taille: number;
}

export function pagine(dto: PaginationDto) {
  return { skip: (dto.page - 1) * dto.taille, take: dto.taille };
}
