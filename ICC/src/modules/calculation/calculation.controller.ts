import { Body, Controller, Post, Req } from '@nestjs/common';
import { CalculationService } from 'src/modules/calculation/calculation.service';
import { CalculationIndexDto } from 'src/modules/calculation/dto/calculation-index.dto';

@Controller('calculate')
export class CalculationController {
  constructor(private readonly calculationService: CalculationService) { }

  @Post()
  async CalculateNodeChange(@Req() request: Request, @Body() calculationIndexDto: CalculationIndexDto): Promise<void> {
    await this.calculationService.HandleRequiredNodeChanges(calculationIndexDto);
  }
}
