import { CalculationIndexDto } from 'src/modules/calculation/dto/calculation-index.dto';

export interface ICalculationService {
  HandleRequiredNodeChanges(calculationIndex: CalculationIndexDto): Promise<void>;
  getRequiredNRI(): number;
}
