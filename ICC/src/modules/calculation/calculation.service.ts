import { Injectable } from '@nestjs/common';
import { VultrService } from 'src/modules/vultr/vultr.service';
import { ICalculationService } from 'src/modules/calculation/calculation.service.interface';
import { CalculationIndexDto } from 'src/modules/calculation/dto/calculation-index.dto';
import { CreationService } from 'src/modules/creation/creation.service';
import { RemovalService } from 'src/modules/removal/removal.service';
import { GlobalService } from 'src/modules/global/global.service';
import { ICCException } from 'src/shared/exception.utils';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class CalculationService implements ICalculationService {
  private differenceNRI: number;
  constructor(
    private readonly vultrService: VultrService,
    private readonly creationService: CreationService,
    private readonly removalService: RemovalService,
    private readonly globalService: GlobalService,
  ) { }

  async HandleRequiredNodeChanges(calculationIndex: CalculationIndexDto): Promise<void> {
    if (calculationIndex == null || calculationIndex.forecast == null || calculationIndex.forecast.length === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.HandleRequiredNodeChanges.name, ICCException.calculationIndexNotFoundOrEmptyMessage);
    }
    if (this.globalService.nodePlansMap == null) {
      ICCException.logError(NotFoundException, this.constructor.name, this.HandleRequiredNodeChanges.name, ICCException.noNodePlansMapFoundMessage);
    }
    if (!this.globalService.nodePlansMapHasValidValues()) {
      ICCException.logError(NotFoundException, this.constructor.name, this.HandleRequiredNodeChanges.name, ICCException.nodePlansMapHasNoValidValuesMessage);
    }
    this.globalService.calculationIndex = calculationIndex;
    const nodePoolsList = await this.vultrService.getAllNodePools();
    if (nodePoolsList == null || nodePoolsList.node_pools == null || nodePoolsList.node_pools.length === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.HandleRequiredNodeChanges.name, ICCException.nodepoolListNotFoundOrEmptyMessage);
    }

    const currentNRI = this.globalService.getCurrentNRI(nodePoolsList);
    const requiredNRI = this.getRequiredNRI();

    this.differenceNRI = requiredNRI - currentNRI;

    if (this.differenceNRI == 0 || (this.globalService.getMinimalIndexOfNodePlansMap() > Math.abs(this.differenceNRI) && this.differenceNRI < 0)){
      console.log('No Changes | CurrentNRI: ' + currentNRI);
      return;
    } 

    if (this.differenceNRI > 0) this.creationService.nodeCreationProcess(this.differenceNRI, nodePoolsList);
    else this.removalService.nodeRemovalProcess(currentNRI, nodePoolsList);
  }

  getRequiredNRI(): number {
    if (this.globalService.calculationIndex.forecast.length < this.globalService.minimumIndexLengthForForecast) {
      ICCException.logError(BadRequestException, this.constructor.name, this.getRequiredNRI.name, ICCException.forecastLengthSmallerThanValueMessage, this.globalService.minimumIndexLengthForForecast);
    }
    const upperbound = Math.max(this.globalService.calculationIndex.forecast[2].upper ?? 0, this.globalService.calculationIndex.forecast[1].upper ?? 0);
    if (upperbound === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getRequiredNRI.name, ICCException.upperboundEmptyMessage);
    }
    const nodeIndex = upperbound / this.globalService.scalingMargin;
    return nodeIndex;
  }
}
