import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { NodeDto } from 'src/modules/vultr/dto/node.dto';

export interface IVultrService {
  getAPIKey(): string;
  getClusterId(): string;
  getPlans(): Promise<Map<string, number>>;
  fetchPlans(): Promise<Map<string, number>>;
  getAllNodePools(): Promise<ResponseDto>;
  removeNodepool(nodepoolId: string): Promise<void>;
  updateNodepool(nodepoolId: string, node_quantity: number, max_nodes: number);
  createNodepool(nodeQuantity: number, plan: string, autoScaler: boolean);
  drainNode(instanceId: string): Promise<void>;
  removeNode(instanceId: string, noodpoolid: string): Promise<void>;
  drainNodes(nodes: NodeDto[]): Promise<void>;
  removeNodes(nodes: NodeDto[], nodepoolId: string): Promise<void>;
}
