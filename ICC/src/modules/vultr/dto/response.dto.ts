import { NodepoolDto } from 'src/modules/vultr/dto/nodepool.dto';

export class ResponseDto {
  readonly node_pools: NodepoolDto[];
}
