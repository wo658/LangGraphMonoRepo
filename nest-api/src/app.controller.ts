import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): any {
    try {
      console.log('🎯 Root endpoint called');
      return {
        message: 'NestJS API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 4000,
        mongoUri: process.env.MONGO_URI ? 'SET' : 'NOT SET',
        cors: {
          allowedOrigins: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000')
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        }
      };
    } catch (error) {
      console.error('🚨 Error in root endpoint:', error);
      throw error;
    }
  }

  @Get('health')
  getHealth(): any {
    console.log('🏥 Health endpoint called');
    return { status: 'OK', timestamp: new Date().toISOString() };
  }
}
