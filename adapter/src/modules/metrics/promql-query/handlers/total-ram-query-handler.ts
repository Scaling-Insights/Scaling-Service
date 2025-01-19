import { PromQLQueryHandler } from './promql-query-handler.interface';

export class TotalRamQueryHandler implements PromQLQueryHandler {
  queryName = 'PROMQL_TOTAL_RAM';

  fetchAndProcess(data: any, metrics: any): void {
    const result = data?.["data"]?.["result"]?.[0]?.["value"]?.[1];
    try {
        if (result) {
          metrics.total_ram = Number(result);
        } else {
          console.error('Invalid data for total RAM');
          process.exit(1);
        }
    } catch (error) {
          console.error('Invalid data for total RAM ' + error);
          process.exit(1);
    }
  }
}
