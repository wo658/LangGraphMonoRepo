import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiUsageService } from '../ai-usage/ai-usage.service';

@Controller('ai')
export class AiController {
  constructor(private aiUsageService: AiUsageService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Req() req: Request & { user: any }, @Body() body: { prompt: string }) {
    const userId = req.user._id.toString();
    
    // Track usage before processing
    const estimatedTokens = Math.ceil(body.prompt.length / 4) * 2; // Simple estimation
    await this.aiUsageService.increment(userId, {
      requests: 1,
      tokens: estimatedTokens,
    });

    // Here you would integrate with your actual AI service (OpenAI, etc.)
    return {
      response: `AI response to: ${body.prompt}`,
      usage: {
        tokens: estimatedTokens,
      },
    };
  }

  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@Req() req: Request & { user: any }) {
    const userId = req.user._id.toString();
    return this.aiUsageService.checkUsage(userId);
  }
}