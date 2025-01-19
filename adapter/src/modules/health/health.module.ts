import { HealthService } from './health.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { HealthController } from 'src/modules/health/health.controller';

@Module({
    imports: [],
    controllers: [HealthController],
    providers: [
        HealthService, ],
})
export class HealthModule {}
