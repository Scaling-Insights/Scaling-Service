import { ResponseDto } from 'src/modules/vultr/dto/response.dto';

export interface ICreationService {
  nodeCreationProcess(differenceNRI: number, nodePoolsList: ResponseDto): void;
  getNewNodeplanCombination(nodeIndex: number, nodePoolsList: ResponseDto): Promise<Map<string, number>>;
  getCheapestNodeplanCombination(possibleCombinations: Map<string, number>[]): Promise<Map<string, number>>;
  calculateNodeplanCombinationPrice(nodeplanCombination: Map<string, number>): Promise<number>;
  recursiveGetPossiblePlans(neededIndex: number, list: Map<string, number>[], currentPlanCombination: Map<string, number>);
}
