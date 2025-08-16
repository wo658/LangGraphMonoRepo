import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiUsageService } from './ai-usage.service';
import { OpenRouterService } from './openrouter.service';
import { SYSTEM_PRIMER_LANGGRAPH, buildUserPrompt } from './prompt-templates';
import { GenerateRequestDto, GenerateResponseDto } from './dto/generate.dto';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(
    private aiUsageService: AiUsageService,
    private openRouter: OpenRouterService,
  ) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    description: 'Generate or modify code using OpenRouter (Qwen 2.5 Coder 32B Instruct)',
    schema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['python', 'typescript', 'javascript'] },
        instruction: { type: 'string' },
        code: { type: 'string' },
        stream: { type: 'boolean', default: false },
      },
      required: ['language', 'instruction'],
    },
  })
  @ApiOkResponse({
    description: 'Generated code or modifications',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        usage: {
          type: 'object',
          properties: {
            promptTokens: { type: 'number' },
            completionTokens: { type: 'number' },
            totalTokens: { type: 'number' },
          },
        },
        model: { type: 'string' },
      },
    },
  })
  async generate(
    @Req() req: Request & { user: any },
    @Body() body: GenerateRequestDto,
  ): Promise<GenerateResponseDto> {
    const userId = req.user._id.toString();

    // Pre-check remaining tokens to avoid obvious overuse
    const remaining = (await this.aiUsageService.checkUsage(userId)).remainingTokens12h;
    const maxCompletion = 2048;
    const promptOverhead = Math.ceil(((body.instruction?.length || 0) + (body.code?.length || 0)) / 4) + 256;
    const requiredRough = maxCompletion + promptOverhead; // rough bound
    if (remaining < requiredRough) {
      throw new ForbiddenException('Insufficient tokens remaining for this request');
    }

    const messages = [
      { role: 'system' as const, content: SYSTEM_PRIMER_LANGGRAPH },
      { role: 'user' as const, content: buildUserPrompt(body.language, body.instruction, body.code) },
    ];

    const result = await this.openRouter.createChatCompletion(messages, {
      model: process.env.AI_MODEL || 'qwen-2.5-coder-32b-instruct',
      temperature: 0.2,
      max_tokens: 2048,
    });

    // Deduct actual usage
    await this.aiUsageService.increment(userId, result.usage.total_tokens || 0);

    return {
      message: result.message,
      usage: {
        promptTokens: result.usage.prompt_tokens,
        completionTokens: result.usage.completion_tokens,
        totalTokens: result.usage.total_tokens,
      },
      model: result.model,
    };
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@Req() req: Request & { user: any }) {
    const userId = req.user._id.toString();
    return this.aiUsageService.checkUsage(userId);
  }
}