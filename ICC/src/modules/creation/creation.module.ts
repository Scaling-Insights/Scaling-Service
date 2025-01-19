import { CreationService } from 'src/modules/creation/creation.service';
import { Module } from '@nestjs/common';
import { VultrModule } from 'src/modules/vultr/vultr.module';
import { GlobalModule } from 'src/modules/global/global.module';

@Module({
  imports: [VultrModule, GlobalModule],
  controllers: [],
  providers: [CreationService],
  exports: [CreationService],
})
export class CreationModule {}
