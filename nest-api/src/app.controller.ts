import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    return {
      message: 'NestJS API is running!',
      environment: process.env.NODE_ENV || 'development',
      cors: {
        allowedOrigins: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      }
    };
  }
}
