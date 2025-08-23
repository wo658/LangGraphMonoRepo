import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
const serverlessExpress = require('serverless-http');

async function createApp() {
  const app = await NestFactory.create(AppModule);

  // Trust proxy
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

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  // Swagger는 Lambda 환경에서 정적 파일 서빙 문제로 비활성화
  // Production 환경에서는 별도의 API 문서 사이트 사용 권장
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Nest API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app.getHttpAdapter().getInstance();
}

let server: any;

export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (!server) {
    const expressApp = await createApp();
    server = serverlessExpress(expressApp);
  }
  return server(event, context);
};
