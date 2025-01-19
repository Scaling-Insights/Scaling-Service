import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GlobalService } from 'src/modules/global/global.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GlobalService],
  exports: [GlobalService]
})
export class GlobalModule {}
