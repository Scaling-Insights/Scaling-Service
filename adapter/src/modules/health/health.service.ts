import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppDataSource } from 'src/database/data-source';
import axios from 'axios';
import { Metrics } from 'src/shared/entities/metrics.entity';

@Injectable()
export class HealthService {
    constructor(
        private readonly configService: ConfigService
    ) { }

    async checkPrometheusConnection(): Promise<boolean> {
        try {
            const prometheusUrl = this.configService.get<string>('PROM_URL');
            if (!prometheusUrl) {
                console.error('PROM_URL not found in config');
                return false;
            }

            const query = this.configService.get<string>('PROMQL_NODE_COUNT');
            if (!query) {
                console.error('No query found for PROMQL_NODE_COUNT');
                return false;
            }

            const response = await axios.get(`${prometheusUrl}?query=${encodeURIComponent(query)}`);
            if (response.status !== 200) {
                console.error('Prometheus API is unavailable:', response.statusText);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error while checking Prometheus API:', error.message);
            return false;
        }
    }

    async checkDatabaseConnection(): Promise<boolean> {
        try {
            await AppDataSource.query('SELECT 1');
            return true;
        } catch (error) {
            console.error('Error while checking database connection:', error.message);
            return false;
        }
    }
}
