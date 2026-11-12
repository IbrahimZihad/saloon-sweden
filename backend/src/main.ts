import 'dotenv/config';
import 'reflect-metadata';
import { createApp } from './app';
import { validateEnv } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const env = validateEnv(process.env);
  const app = await createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Backend running at http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
    console.log(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
  });

  const shutdown = () => {
    for (const task of app.locals.notificationTasks as Array<{ stop(): void }>) task.stop();
    server.close(() => {
      void app.locals.database.close().finally(() => process.exit(0));
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error instanceof Error ? error.message : error);
  process.exit(1);
});