import { MetricsService } from './metrics.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NodeCountQueryHandler } from './promql-query/handlers/node-count-query-handler';
import { TotalCpuQueryHandler } from './promql-query/handlers/total-cpu-query-handler';
import { PromQLQueryHandler } from './promql-query/handlers/promql-query-handler.interface';
import { AvgUsageCpuQueryHandler } from './promql-query/handlers/avg-usage-cpu-query-handler';
import { TotalRamQueryHandler } from './promql-query/handlers/total-ram-query-handler';
import { AvgUsageRamQueryHandler } from './promql-query/handlers/avg-usage-ram-query-handler';
import { AvgRequestQueryHandler } from './promql-query/handlers/avg-request-query-handler';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [],
  providers: [
    MetricsService,
    NodeCountQueryHandler,
    TotalCpuQueryHandler,
    AvgUsageCpuQueryHandler,
    TotalRamQueryHandler,
    AvgUsageRamQueryHandler,
    AvgRequestQueryHandler,
    // ADD NEW HANDLER HERE
    {
      provide: 'PromQLQueryHandlers',
      useFactory: (...handlers: PromQLQueryHandler[]) => handlers,
      inject: [
        NodeCountQueryHandler,
        TotalCpuQueryHandler,
        AvgUsageCpuQueryHandler,
        TotalRamQueryHandler,
        AvgUsageRamQueryHandler,
        AvgRequestQueryHandler,
        // ADD NEW HANDLER HERE
      ],
    },
  ],
  exports: [
    'PromQLQueryHandlers', 
    MetricsService
  ],
})
export class MetricsModule { }

