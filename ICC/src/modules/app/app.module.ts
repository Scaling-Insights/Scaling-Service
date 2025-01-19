import { RemovalModule } from 'src/modules/removal/removal.module';
import { CreationModule } from 'src/modules/creation/creation.module';
import { VultrModule } from 'src/modules/vultr/vultr.module';
import { Module } from '@nestjs/common';
import { CalculationModule } from 'src/modules/calculation/calculation.module';
import { GlobalModule } from 'src/modules/global/global.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    RemovalModule,
    CreationModule,
    VultrModule,
    CalculationModule,
    CreationModule,
    GlobalModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
