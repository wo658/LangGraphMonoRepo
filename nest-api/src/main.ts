import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  console.log('🚀 Starting NestJS application...');
  console.log('Environment variables:');
  console.log('PORT:', process.env.PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('FRONTEND_URLS:', process.env.FRONTEND_URLS);
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
  
  const app = await NestFactory.create(AppModule);
  
  // Trust proxy for correct protocol detection (Secure cookies behind Railway)
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter.getType() === 'express') {
    httpAdapter.getInstance().set('trust proxy', 1);
  }

  const allowedOrigins = (
    process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  
  console.log('🌐 Allowed CORS origins:', allowedOrigins);

  // Enable CORS - Allow all origins for now to debug
  app.enableCors({
    origin: true, // Allow all origins temporarily
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Enable cookie parser
  app.use(cookieParser());

  // Swagger (OpenAPI) docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nest API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);
  
  const port = process.env.PORT || 4000;
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Global error handling
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  await app.listen(port, '0.0.0.0');
  console.log(`🎉 Application is running on port: ${port}`);
  console.log(`🌍 Railway URL: https://api.langvis.com`);
  console.log(`📡 Local access: http://localhost:${port}`);
}
bootstrap();
