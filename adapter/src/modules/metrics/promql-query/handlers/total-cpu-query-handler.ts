import { PromQLQueryHandler } from './promql-query-handler.interface';

export class TotalCpuQueryHandler implements PromQLQueryHandler {
  queryName = 'PROMQL_TOTAL_CPU';

  fetchAndProcess(data: any, metrics: any): void {
    const result = data?.["data"]?.["result"]?.[0]?.["value"]?.[1];
    try {
        if (result) {
          metrics.total_cpu = Number(result);
        } else {
          console.error('Invalid data for total CPU');
          process.exit(1);
        }
    } catch (error) {
          console.error('Error parsing Prometheus data: ' + error);
          process.exit(1);
    }
  }
}
