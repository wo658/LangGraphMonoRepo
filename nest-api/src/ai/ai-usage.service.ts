import {
  Injectable,
  ForbiddenException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AiUsageService implements OnModuleInit, OnModuleDestroy {
  private quotaResetInterval?: NodeJS.Timeout;
  private readonly logger = new Logger(AiUsageService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    // Initialize missing token quota field for existing users and schedule resets
    await this.ensureTokenQuotaField();
    this.scheduleTokenQuotaReset();
  }

  onModuleDestroy() {
    if (this.quotaResetInterval) {
      clearInterval(this.quotaResetInterval);
    }
  }

  private async ensureTokenQuotaField(defaultTokens = 15000) {
    try {
      await this.userModel
        .updateMany(
          { aiTokensRemaining12h: { $exists: false } },
          { $set: { aiTokensRemaining12h: defaultTokens } },
        )
        .exec();
    } catch (e) {
      this.logger.warn(`ensureTokenQuotaField failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  private scheduleTokenQuotaReset(
    intervalMs = 12 * 60 * 60 * 1000,
    resetToTokens = 15000,
  ) {
    this.quotaResetInterval = setInterval(() => {
      this.resetAllTokenQuotas(resetToTokens).catch((e) =>
        this.logger.warn(`resetAllTokenQuotas failed: ${e instanceof Error ? e.message : e}`),
      );
    }, intervalMs);
    this.logger.log('Scheduled 12-hour AI token quota reset interval');
  }

  async resetAllTokenQuotas(resetToTokens = 15000) {
    await this.userModel
      .updateMany({}, { $set: { aiTokensRemaining12h: resetToTokens } })
      .exec();
  }

  async increment(userId: string, tokensToConsume: number): Promise<UserDocument> {
    if (tokensToConsume <= 0) {
      return this.userModel.findById(userId);
    }
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const remaining = user.aiTokensRemaining12h ?? 15000;
    if (remaining < tokensToConsume) {
      throw new ForbiddenException('12-hour token quota exceeded');
    }
    user.aiTokensRemaining12h = remaining - tokensToConsume;
    return user.save();
  }

  async checkUsage(userId: string): Promise<{ remainingTokens12h: number }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const remaining = user.aiTokensRemaining12h ?? 15000;
    return { remainingTokens12h: remaining };
  }
}
