import { Injectable } from '@nestjs/common';
import { CalculationIndexDto } from 'src/modules/calculation/dto/calculation-index.dto';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { ConfigService } from '@nestjs/config';
import { IGlobalService } from 'src/modules/global/global.service.interface';
import { ICCException } from 'src/shared/exception.utils';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class GlobalService implements IGlobalService {
  readonly scalingMargin: number;
  readonly removeAfterMinute: number;
  readonly removeBeforeMinute: number;
  readonly minutesBetweenIteration: number;
  readonly minimumIndexLengthForForecast: number;
  readonly ignoredNodepoolTags: string[];
  calculationIndex: CalculationIndexDto;

  readonly nodePlansMap: Map<string, number> = new Map([
    ['vhp-2c-2gb-intel', 2],
    ['vhp-4c-8gb-intel', 4],
    ['vhp-8c-16gb-intel', 8],
  ]);

  constructor(private readonly configService: ConfigService) {
    this.scalingMargin = this.configService.get<number>('SCALING_MARGIN', 0.95);
    this.removeAfterMinute = this.configService.get<number>('REMOVE_AFTER_MINUTE', 50.0);
    this.removeBeforeMinute = this.configService.get<number>('REMOVE_BEFORE_MINUTE', 55);
    this.minutesBetweenIteration = this.configService.get<number>('MINUTES_BETWEEN_ITERATION', 5);
    this.minimumIndexLengthForForecast = this.configService.get<number>('MINIMUM_INDEX_LENGTH_FOR_FORECAST', 3);
    this.ignoredNodepoolTags = this.configService.get<string[]>('IGNORED_NODEPOOL_TAGS');
  }

  calculateCurrentNRI(nodePoolsList: ResponseDto): number {
    let amount: number = 0;
    let nodePoolsWithoutDatabaseTag = nodePoolsList.node_pools.filter(nodepool => !this.ignoredNodepoolTags.includes(nodepool.tag))
    nodePoolsWithoutDatabaseTag.forEach((nodepool) => {
      const nodePlan = nodepool.plan;
      if (!this.nodePlansMap.has(nodePlan)) {
        ICCException.logError(NotFoundException, this.constructor.name, this.calculateCurrentNRI.name, ICCException.nodePlanNotFoundInNodePlansMapMessage, nodePlan);
      }
      const nodePlanValue: number = this.nodePlansMap.get(nodePlan);
      amount += nodePlanValue * nodepool.node_quantity;
    });
    return amount;
  }

  nodePlansMapHasValidValues(): boolean {
    let validvalue = true;
    if (this.nodePlansMap.size === 0) return false;
    for (const value of this.nodePlansMap.values()) {
      if (typeof value !== 'number' || value <= 0) {
        validvalue = false;
        break;
      }
    }
    return validvalue;
  }

  getCurrentNRI(nodePoolsList: ResponseDto): number {
    if (nodePoolsList == null) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getCurrentNRI.name, ICCException.nodePoolsListIsNullOrUndefinedMessage);
    }
    if (nodePoolsList.node_pools == null) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getCurrentNRI.name, ICCException.nodepoolsAreEmptyOrUndefinedMessage);
    }
    return this.calculateCurrentNRI(nodePoolsList);
  }

  getMinimalIndexOfNodePlansMap(): number {
    if (this.nodePlansMap == null || this.nodePlansMap.size === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getMinimalIndexOfNodePlansMap.name, ICCException.nodePlansMapIsEmptyOrUndefinedMessage);
    }
    let lowest: number = Number.MAX_SAFE_INTEGER;
    for (const value of this.nodePlansMap.values()) {
      if (value < lowest) lowest = value;
    }
    return lowest;
  }
}
