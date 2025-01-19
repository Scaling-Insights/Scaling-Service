import { Injectable } from '@nestjs/common';
import { NodepoolDto } from 'src/modules/vultr/dto/nodepool.dto';
import { VultrService } from 'src/modules/vultr/vultr.service';
import { GlobalService } from 'src/modules/global/global.service';
import { ConfigService } from '@nestjs/config';
import { IRemovalService } from 'src/modules/removal/removal.service.interface';
import { NodeDto } from 'src/modules/vultr/dto/node.dto';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { ICCException } from 'src/shared/exception.utils';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class RemovalService implements IRemovalService {
  constructor(
    private readonly globalService: GlobalService,
    private readonly vultrService: VultrService,
    private readonly configService: ConfigService,
  ) { }

  nodeRemovalProcess(currentNRI: number, pools: ResponseDto): void {
    const nodePoolsWithoutDatabaseTag = pools.node_pools.filter((nodepool) => !this.globalService.ignoredNodepoolTags.includes(nodepool.tag));
    if (nodePoolsWithoutDatabaseTag.length === 0) {
      ICCException.logError(NotFoundException, this.constructor.name, this.nodeRemovalProcess.name, ICCException.noNodepoolsWithoutIgnoredNodepoolTagsMessage);
    }

    let nodepoolsPerPlan: NodepoolDto[][] = []
    this.globalService.nodePlansMap.forEach(function (_, key) {
      if (nodePoolsWithoutDatabaseTag.find(nodepool => nodepool.plan == key) !== undefined) {
        nodepoolsPerPlan.unshift(nodePoolsWithoutDatabaseTag.filter(nodepool => nodepool.plan == key));
      }
    });

    if (this.globalService.calculationIndex.forecast.length < this.globalService.minimumIndexLengthForForecast) {
      ICCException.logError(NotFoundException, this.constructor.name, this.nodeRemovalProcess.name, ICCException.forecastLengthSmallerThanValueMessage, this.globalService.minimumIndexLengthForForecast);
    }

    let differenceNRIForRemoval = this.calculateDifferenceNRIForRemoval(currentNRI);

    if (differenceNRIForRemoval <= 0) return;
    for (let nodepools of nodepoolsPerPlan) {
      const res: number = this.removeNodesOnTimeLimit(nodepools, differenceNRIForRemoval);
      differenceNRIForRemoval = res;
      if (differenceNRIForRemoval == 0) break;
    };
  }

  calculateDifferenceNRIForRemoval(currentNRI: number): number {
    const higher15 = this.globalService.calculationIndex.forecast[2].upper;
    const higher10 = this.globalService.calculationIndex.forecast[1].upper;
    const higher5 = this.globalService.calculationIndex.forecast[0].upper;
    return currentNRI - Math.max(higher5, higher10, higher15, this.globalService.getMinimalIndexOfNodePlansMap());
  }

  removeNodesOnTimeLimit(nodePoolList: NodepoolDto[], differenceNRIForRemoval: number): number {
    if (!this.globalService.nodePlansMap.has(nodePoolList[0].plan)) {
      ICCException.logError(BadRequestException, this.constructor.name, this.removeNodesOnTimeLimit.name, ICCException.nodepoolPlanNotFoundInNodePlansMapMessage);
    }
    if (differenceNRIForRemoval < this.globalService.nodePlansMap.get(nodePoolList[0].plan)) {
      return 0;
    }

    for (const nodepool of nodePoolList) {
      const nodePoolNRI = nodepool.nodes.length * this.globalService.nodePlansMap.get(nodepool.plan);
      if (differenceNRIForRemoval >= nodePoolNRI) {
        console.log("Remove all Nodes on Nodepool | Nodepool plan: " + nodepool.plan);
        this.removalProcessOfAllNodesOfAPool(nodepool);
        differenceNRIForRemoval = differenceNRIForRemoval - nodePoolNRI;
      }
      else {
        const now: Date = new Date(Date.now());
        let nodesOnTimeLimit = nodepool.nodes.filter(
          (node) => node.date_created &&
            (now.getMinutes() + 60 - new Date(node.date_created).getMinutes()) % 60 > this.globalService.removeAfterMinute &&
            (now.getMinutes() + 60 - new Date(node.date_created).getMinutes()) % 60 <= this.globalService.removeBeforeMinute);
        console.log("Remove not all nodes of nodepool | NRI difference before removal: " + differenceNRIForRemoval + ", nodepool plan: " + nodepool.plan + ", amount of nodes on time limit: " + nodesOnTimeLimit.length)
        if (this.globalService.nodePlansMap.has(nodepool.plan) && nodesOnTimeLimit.length !== 0) {
          const amountToBeRemoved = Math.floor(differenceNRIForRemoval / this.globalService.nodePlansMap.get(nodepool.plan));
          console.log("amount to be deleted: " + amountToBeRemoved);
          if (amountToBeRemoved !== 0) {
            nodesOnTimeLimit = nodesOnTimeLimit.slice(0, amountToBeRemoved)
            this.removalProcessOfNodes(nodepool, nodesOnTimeLimit);
            differenceNRIForRemoval -= this.globalService.nodePlansMap.get(nodepool.plan) * amountToBeRemoved;
          }
        }
      }
    }
    return differenceNRIForRemoval;
  }

  removalProcessOfAllNodesOfAPool(nodepool: NodepoolDto): void {
    this.vultrService.drainNodes(nodepool.nodes)
      .then((resultDrainAll) => {
        console.log("All nodes succesfully drained");
        return this.vultrService.removeNodepool(nodepool.id);
      })
      .then((resultRemoveNodepool) => {
        console.log("Removed Nodepool successfully");
        return;
      })
      .catch((exception) => {
        ICCException.logError(BadRequestException, this.constructor.name, this.removalProcessOfAllNodesOfAPool.name, exception);
      });
  }

  removalProcessOfNodes(nodepool: NodepoolDto, nodes: NodeDto[]): void {
    this.vultrService.drainNodes(nodes)
      .then((resultDrain) => {
        console.log("All nodes drained successfully")
        return this.vultrService.removeNodes(nodes, nodepool.id);
      })
      .then((resultRemove) => {
        console.log("All nodes removed successfully")
        return;
      })
      .catch((exception) => {
        ICCException.logError(BadRequestException, this.constructor.name, this.removalProcessOfNodes.name, exception);
      });
    nodepool.nodes.shift();
  }
}
