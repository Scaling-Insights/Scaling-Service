import { PromQLQueryHandler } from './promql-query-handler.interface';

export class NodeCountQueryHandler implements PromQLQueryHandler {
  queryName = 'PROMQL_NODE_COUNT';

  fetchAndProcess(data: any, metrics: any): void {
    const result = data?.["data"]?.["result"]?.[0]?.["value"]?.[1];
    try {
        if (result) {
          metrics.nodecount = Number(result);
        } else {
          console.error('Invalid data for node count');
          process.exit(1);
        }
    } catch (error) {
          console.error('Error parsing Prometheus data: ' + error);
          process.exit(1);
    }
  }
}
