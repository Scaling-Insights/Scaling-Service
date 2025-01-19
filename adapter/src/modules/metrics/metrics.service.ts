import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Metrics } from '../../shared/entities/metrics.entity';
import { AppDataSource } from '../../database/data-source';
import { PromQLQueryHandler } from './promql-query/handlers/promql-query-handler.interface';

@Injectable()
export class MetricsService implements OnModuleInit {
  private intervalMs: number;

  constructor(
    @Inject('PromQLQueryHandlers') private readonly queryHandlers: PromQLQueryHandler[],
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) { }

  async onModuleInit() {
    this.intervalMs = this.parseIntervalToMs(
      this.configService.get<string>('REQ_INTERVAL')!,
    );
    console.log("Interval set at: ", this.intervalMs, "ms");
    if (this.intervalMs === 0 || isNaN(this.intervalMs)) {
      throw new Error('Invalid cron interval format');
    }

    const interval = setInterval(async () => {
      console.log('Scheduled task executed');
      this.collectMetrics();
    }, this.intervalMs);
    this.schedulerRegistry.addInterval('metricsInterval', interval);
  }

  private async collectMetrics() {
    const metrics = new Metrics();
    metrics.time = new Date();

    const prometheusUrl = this.configService.get<string>('PROM_URL');
    if (!prometheusUrl) {
      console.error('PROM_URL not found in config');
      return;
    }

    

    try {
      for (const handler of this.queryHandlers) {
        const query = this.configService.get<string>(handler.queryName);
        if (!query) {
          console.error(`No query found for ${handler.queryName}`);
          continue;
        }

        const response = await axios.get(`${prometheusUrl}?query=${encodeURIComponent(query)}`);
        handler.fetchAndProcess(response.data, metrics);
      }

      await this.saveMetricsToDatabase(metrics);
    } catch (error) {
      console.error('Error during metrics collection:', error.message);
    }
  }

  private async saveMetricsToDatabase(metrics: Metrics) {
    if (!metrics) {
      throw new Error('Metrics object is required');
    }

    try {
      const metricsRepo = AppDataSource.getRepository(Metrics);
      await metricsRepo.save(metrics);

      const allMetrics = await metricsRepo.find();
      console.log('All metrics:', allMetrics);

    } catch (error) {
      console.error('Error saving metrics: ', error);
    }
  }

  private parseIntervalToMs(interval: string): number {
    const seconds = parseInt(interval, 10);
    if (isNaN(seconds)) {
      console.error("Invalid CRON_INTERVAL format");
      throw new Error('Invalid CRON_INTERVAL format');
    }
    return seconds * 1000;
  }
}
