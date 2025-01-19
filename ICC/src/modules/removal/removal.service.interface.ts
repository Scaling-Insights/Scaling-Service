import { NodepoolDto } from 'src/modules/vultr/dto/nodepool.dto';
import { NodeDto } from 'src/modules/vultr/dto/node.dto';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';

export interface IRemovalService {
  nodeRemovalProcess(differenceNRI: number, pools: ResponseDto): void;
  removeNodesOnTimeLimit(nodePoolList: NodepoolDto[], differenceNRIForRemoval: number): number;
  removalProcessOfAllNodesOfAPool(nodepool: NodepoolDto): void;
  removalProcessOfNodes(nodepool: NodepoolDto, nodes: NodeDto[]): void;
  calculateDifferenceNRIForRemoval(currentNRI: number): number;
}
