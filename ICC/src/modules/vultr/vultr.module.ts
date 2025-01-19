import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { VultrService } from 'src/modules/vultr/vultr.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [VultrService, ResponseDto],
  exports: [VultrService, ResponseDto],
})
export class VultrModule {}
