import { NodeDto } from 'src/modules/vultr/dto/node.dto';

export class NodepoolDto {
  readonly id: string;
  readonly label: string;
  readonly tag: string;
  readonly plan: string;
  readonly status: string;
  readonly node_quantity: number;
  readonly min_nodes: number;
  readonly max_nodes: number;
  readonly auto_scaler: boolean;
  readonly nodes: NodeDto[];
}
