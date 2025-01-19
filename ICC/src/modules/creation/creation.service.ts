import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { VultrService } from 'src/modules/vultr/vultr.service';
import { Injectable } from '@nestjs/common';
import { GlobalService } from 'src/modules/global/global.service';
import { ICreationService } from 'src/modules/creation/creation.service.interface';
import { ICCException } from 'src/shared/exception.utils';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class CreationService implements ICreationService {
  constructor(
    private readonly vultrService: VultrService,
    private readonly globalService: GlobalService,
  ) { }

  async nodeCreationProcess(differenceNRI: number, nodePoolsList: ResponseDto,): Promise<void> {
    const nodePlans: Map<string, number> = await this.getNewNodeplanCombination(differenceNRI, nodePoolsList,);
    if (nodePlans == null || nodePlans.size === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.nodeCreationProcess.name, ICCException.noNodeplansFoundMessage);
    }
    for (const [plan, amount] of nodePlans) {
      if (amount <= 0) continue;
      if (nodePoolsList.node_pools.some((item) => item.plan === plan)) {
        const pool = nodePoolsList.node_pools.find((item) => item.plan === plan);
        console.log("Update | Nodepoolid: " + pool.id + ", new Node quantity: " + (pool.node_quantity + amount) + ", new Max node quantity: " + (pool.max_nodes + amount))
        this.vultrService.updateNodepool(pool.id, pool.node_quantity + amount, pool.max_nodes + amount);
      }
      else {
        console.log("Create | Plan: " + plan + ", Amount: " + amount, ", Autoscaling: ", false)
        this.vultrService.createNodepool(amount, plan, true);
      }
    }
  }

  async getNewNodeplanCombination(nodeIndex: number, nodePoolsList: ResponseDto,): Promise<Map<string, number>> {
    const startingRecord: Map<string, number> = new Map();
    this.globalService.nodePlansMap.forEach(function (_, key) {
      startingRecord.set(key, 0);
    });

    let diff = Math.min(this.globalService.calculationIndex.forecast[10].upper - this.globalService.getCurrentNRI(nodePoolsList), nodeIndex,);
    let modDiff = diff % this.globalService.getMinimalIndexOfNodePlansMap();
    if(modDiff < this.globalService.getMinimalIndexOfNodePlansMap() && diff > 0){
      diff = diff - modDiff + diff % this.globalService.getMinimalIndexOfNodePlansMap();
    }
    const possibleEndCombinations: Map<string, number>[] = [];
    let minimalCombinationNeededForDownscaling: Map<string, number> | undefined;
    if (diff > 0) {
      this.recursiveGetPossiblePlans(diff, possibleEndCombinations, startingRecord);
      minimalCombinationNeededForDownscaling = await this.getCheapestNodeplanCombination(possibleEndCombinations);
    }
    else diff = 0;
    const possibleCombinations: Map<string, number>[] = [];
    this.recursiveGetPossiblePlans(nodeIndex - diff, possibleCombinations, startingRecord);
    const cheapestPlanComb = await this.getCheapestNodeplanCombination(possibleCombinations);
    if (minimalCombinationNeededForDownscaling) {
      minimalCombinationNeededForDownscaling.forEach(function (value, key) {
        cheapestPlanComb.set(key, value + cheapestPlanComb.get(key));
      });
    }
    return cheapestPlanComb;
  }

  async getCheapestNodeplanCombination(possibleCombinations: Map<string, number>[]): Promise<Map<string, number>> {
    if (possibleCombinations == null || possibleCombinations.length === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getCheapestNodeplanCombination.name, ICCException.noNodeplanCombinationsFoundOrEmptyMessage);
    }

    let cheapestPlanCombinationPrice = Number.MAX_SAFE_INTEGER;
    let cheapestPlanCombination: Map<string, number> = new Map();

    for (const nodeplanCombination of possibleCombinations) {
      const price = await this.calculateNodeplanCombinationPrice(nodeplanCombination);
      if (cheapestPlanCombinationPrice > price) {
        cheapestPlanCombinationPrice = price;
        cheapestPlanCombination = nodeplanCombination;
      }
    }
    return cheapestPlanCombination;
  }


  async calculateNodeplanCombinationPrice(nodeplanCombination: Map<string, number>): Promise<number> {
    let total = 0;
    const plans = await this.vultrService.fetchPlans();
    if (plans == null || plans.size === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.calculateNodeplanCombinationPrice.name, ICCException.noNodeplansFoundOrEmptyMessage);
    }
    nodeplanCombination.forEach(function (value, key) {
      total += plans.get(key) * value;
    });
    return total;
  }

  recursiveGetPossiblePlans(neededIndex: number, list: Map<string, number>[], currentPlanCombination: Map<string, number>): void {
    if (neededIndex <= 0) {
      list.push(currentPlanCombination);
      return;
    }
    const plans: string[] = [];
    this.globalService.nodePlansMap.forEach(function (_, key) {
      plans.push(key);
    });
    for (let i = 0; i < plans.length; i++) {
      let canBeAdded: boolean = true;
      for (let j = i + 1; j < plans.length; j++) {
        if (currentPlanCombination.get(plans[j]) !== 0) {
          canBeAdded = false;
          break;
        }
      }
      if (canBeAdded) {
        const planCombination: Map<string, number> = new Map(currentPlanCombination);
        planCombination.set(plans[i], planCombination.get(plans[i]) + 1);
        this.recursiveGetPossiblePlans(neededIndex - this.globalService.nodePlansMap.get(plans[i]), list, planCombination);
      }
    }
  }
}
