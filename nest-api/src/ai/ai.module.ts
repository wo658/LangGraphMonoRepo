import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiUsageModule } from '../ai-usage/ai-usage.module';

@Module({
  imports: [AiUsageModule],
  controllers: [AiController],
})
export class AiModule {}