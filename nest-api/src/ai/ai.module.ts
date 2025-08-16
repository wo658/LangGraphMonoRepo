import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiUsageService } from './ai-usage.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OpenRouterService } from './openrouter.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AiController],
  providers: [AiUsageService, OpenRouterService],
  exports: [AiUsageService, OpenRouterService],
})
export class AiModule {}