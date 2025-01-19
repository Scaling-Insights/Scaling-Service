import { Module } from '@nestjs/common';
import { CalculationController } from 'src/modules/calculation/calculation.controller';
import { CalculationService } from 'src/modules/calculation/calculation.service';
import { VultrModule } from 'src/modules/vultr/vultr.module';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { CalculationIndexDto } from 'src/modules/calculation/dto/calculation-index.dto';
import { CreationModule } from 'src/modules/creation/creation.module';
import { RemovalModule } from 'src/modules/removal/removal.module';

@Module({
  imports: [VultrModule, ResponseDto, CreationModule, RemovalModule],
  controllers: [CalculationController],
  providers: [CalculationService, CalculationIndexDto],
  exports: [CalculationService, CalculationIndexDto],
})
export class CalculationModule {}
