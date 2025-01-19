import { HealthModule } from './../health/health.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppDataSource } from 'src/database/data-source';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsModule } from '../metrics/metrics.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    HealthModule, 
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    ScheduleModule.forRoot(),
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }