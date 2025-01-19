import { RemovalService } from 'src/modules/removal/removal.service';
import { Module } from '@nestjs/common';
import { VultrModule } from 'src/modules/vultr/vultr.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [VultrModule, ConfigModule],
  controllers: [],
  providers: [RemovalService],
  exports: [RemovalService],
})
export class RemovalModule {}
