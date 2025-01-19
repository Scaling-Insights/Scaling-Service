import { NestFactory } from '@nestjs/core';
import { AppDataSource } from './database/data-source';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('Database Initialized');

    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations completed');

    const app = await NestFactory.create(AppModule);
    app.listen(3000)
    
  } catch (error) {
    console.error('Database Initialization Error: ', error);
    process.exit(1);
  }
}
bootstrap();
