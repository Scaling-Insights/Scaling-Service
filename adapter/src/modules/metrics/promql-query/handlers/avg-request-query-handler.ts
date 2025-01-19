import { PromQLQueryHandler } from './promql-query-handler.interface';

export class AvgRequestQueryHandler implements PromQLQueryHandler {
  queryName = 'PROMQL_AVG_REQUEST';

  fetchAndProcess(data: any, metrics: any): void {
    const result = data?.["data"]?.["result"]?.[0]?.["value"]?.[1];
    try {
        if (result) {
          metrics.average_request = Number(result);
        } else {
          console.error('Invalid data for average request');
          process.exit(1);
        }
    } catch (error) {
          console.error('Error parsing Prometheus data: ' + error);
          process.exit(1);
    }
  }
}
