import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AiUsageService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async increment(
    userId: string,
    usage: { requests?: number; tokens?: number },
    now: Date = new Date(),
  ): Promise<UserDocument> {
    const monthKey = now.toISOString().slice(0, 7); // YYYY-MM format
    
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if it's a new month, reset counters if needed
    if (user.aiUsage.monthKey !== monthKey) {
      user.aiUsage = {
        monthKey,
        requestCount: 0,
        tokenCount: 0,
        limits: user.aiUsage.limits || {
          request: 1000,
          tokens: 100000,
        },
      };
    }

    // Check limits before incrementing
    const newRequestCount = user.aiUsage.requestCount + (usage.requests || 0);
    const newTokenCount = user.aiUsage.tokenCount + (usage.tokens || 0);

    if (
      user.aiUsage.limits?.request &&
      newRequestCount > user.aiUsage.limits.request
    ) {
      throw new ForbiddenException('Monthly request limit exceeded');
    }

    if (
      user.aiUsage.limits?.tokens &&
      newTokenCount > user.aiUsage.limits.tokens
    ) {
      throw new ForbiddenException('Monthly token limit exceeded');
    }

    // Update usage
    user.aiUsage.requestCount = newRequestCount;
    user.aiUsage.tokenCount = newTokenCount;

    return user.save();
  }

  async checkUsage(userId: string): Promise<{
    used: { requests: number; tokens: number };
    limits: { requests: number; tokens: number };
    remaining: { requests: number; tokens: number };
  }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const monthKey = new Date().toISOString().slice(0, 7);
    
    // Reset if new month
    if (user.aiUsage.monthKey !== monthKey) {
      return {
        used: { requests: 0, tokens: 0 },
        limits: {
          requests: user.aiUsage.limits?.request || 1000,
          tokens: user.aiUsage.limits?.tokens || 100000,
        },
        remaining: {
          requests: user.aiUsage.limits?.request || 1000,
          tokens: user.aiUsage.limits?.tokens || 100000,
        },
      };
    }

    const limits = {
      requests: user.aiUsage.limits?.request || 1000,
      tokens: user.aiUsage.limits?.tokens || 100000,
    };

    return {
      used: {
        requests: user.aiUsage.requestCount,
        tokens: user.aiUsage.tokenCount,
      },
      limits,
      remaining: {
        requests: limits.requests - user.aiUsage.requestCount,
        tokens: limits.tokens - user.aiUsage.tokenCount,
      },
    };
  }
}