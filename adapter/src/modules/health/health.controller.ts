import { Controller, Get, HttpCode, NotFoundException } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
    ) { }

    @Get('healthz')
    async healthCheck(): Promise<{ status: string }> {
        const isPrometheusHealthy = await this.healthService.checkPrometheusConnection();
        if (!isPrometheusHealthy) {
            throw new NotFoundException('Prometheus API is unavailable');
        }

        const isDbHealthy = await this.healthService.checkDatabaseConnection();
        if (!isDbHealthy) {
            throw new NotFoundException('Database connection is not initialized');
        }

        return { status: 'ok' };
    }
}
