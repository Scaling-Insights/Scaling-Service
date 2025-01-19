import { HourPredictionDTO } from 'src/modules/calculation/dto/hour-prediction.dto';

export class CalculationIndexDto {
  readonly forecast: HourPredictionDTO[];
}
