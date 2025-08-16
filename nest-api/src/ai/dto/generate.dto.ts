export class GenerateRequestDto {
  language!: 'python' | 'typescript' | 'javascript';
  instruction!: string;
  code?: string;
  stream?: boolean;
}

export class GenerateResponseDto {
  message!: string;
  usage!: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model!: string;
}
