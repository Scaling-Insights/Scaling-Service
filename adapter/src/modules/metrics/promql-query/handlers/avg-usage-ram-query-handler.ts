import { PromQLQueryHandler } from './promql-query-handler.interface';

export class AvgUsageRamQueryHandler implements PromQLQueryHandler {
  queryName = 'PROMQL_AVG_RAM';

  fetchAndProcess(data: any, metrics: any): void {
    const result = data?.["data"]?.["result"]?.[0]?.["value"]?.[1];
    try {
        if (result) {
          metrics.avg_usage_ram = Number(result);
        } else {
          console.error('Invalid data for average RAM usage');
          process.exit(1);
        }
    } catch (error) {
          console.error('Error parsing Prometheus data: ' + error);
          process.exit(1);
    }
  }
}
