import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  code!: string;

  @IsIn(['python', 'typescript', 'javascript'])
  language!: 'python' | 'typescript' | 'javascript';

  @IsOptional()
  @IsIn(['public', 'private'])
  visibility?: 'public' | 'private';
}
