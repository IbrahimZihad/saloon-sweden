import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DecimalSerializerInterceptor } from './common/interceptors/decimal-serializer.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = config.get<number>('PORT') ?? 3001;
  const frontendUrl = config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.setGlobalPrefix('api');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new DecimalSerializerInterceptor());

  // Uploaded images are served as static files with random UUID filenames.
  const uploadDir = resolve(process.cwd(), config.get<string>('UPLOAD_DIRECTORY') ?? 'uploads');
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Salon Booking API')
    .setDescription('REST API for the Swedish salon website and appointment management system')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('salon_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  logger.log(`Backend running at http://localhost:${port}/api (${isProduction ? 'production' : 'development'})`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application:', error instanceof Error ? error.message : error);
  process.exit(1);
});