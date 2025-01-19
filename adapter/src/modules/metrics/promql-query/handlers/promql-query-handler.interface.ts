export interface PromQLQueryHandler {
    queryName: string;
    fetchAndProcess(data: any, metrics: any): void;
  }
  