import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { IVultrService } from 'src/modules/vultr/vultr.service.interface';
import { PlanDTO } from 'src/modules/vultr/dto/plan.dto';
import { NodeDto } from './dto/node.dto';
import { ICCException } from 'src/shared/exception.utils';

@Injectable()
export class VultrService implements IVultrService {
  private readonly configService: ConfigService;
  private plans: Map<string, number>;
  private previousPlanFetch: Date;
  constructor() {
    this.configService = new ConfigService();
  }

  getAPIKey(): string {
    return this.configService.get<string>('API_KEY_VULTR');
  }
  getClusterId(): string {
    return this.configService.get<string>('VKE_ID');
  }

  async getAllNodePools(): Promise<ResponseDto> {
    const options = {
      method: 'GET',
      url: 'https://api.vultr.com/v2/kubernetes/clusters/' + this.getClusterId() + '/node-pools',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getAPIKey(),
      },
    };
    try {
      const response = await axios.request(options);
      const Data: ResponseDto = response.data;
      if (response.status === 200) {
        return Data;
      }
      else {
        throw new HttpException(response.statusText, response.status);
      }
    }
    catch (exception) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getAllNodePools.name, exception)
    }
  }
  async getPlans(): Promise<Map<string, number>> {
    const options = {
      method: 'GET',
      url: 'https://api.vultr.com/v2/plans',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getAPIKey(),
      },
    };

    try {
      const response = await axios.request(options);
      const Data: PlanDTO[] = response.data.plans;
      if (response.status === 200) {
        const result: Map<string, number> = new Map();
        for (const plan of Data) {
          result.set(plan.id, plan.monthly_cost);
        }
        return result;
      }
      else {
        throw new HttpException(response.statusText, response.status);
      }
    }
    catch (exception) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getAllNodePools.name, exception)
    }
  }

  async fetchPlans(): Promise<Map<string, number>> {
    if(this.plans == null) {
      this.plans = await this.getPlans();
      this.previousPlanFetch = new Date();
      return this.plans;
    }
    return this.previousPlanFetch.getDate >= new Date().getDate ? this.plans : await this.getPlans();
  }

  async drainNode(instanceId: string): Promise<void> {
    const options = {
      method: 'POST',
      url: 'https://api.vultr.com/v2/instances/' + instanceId + '/halt',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getAPIKey(),
      },
    };
    try{
      const response = await axios.request(options);
      if (response.status === 204) {
        return;
      }
      else {
        throw new HttpException(response.statusText, response.status);
      }
    }
    catch (exception) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getAllNodePools.name, exception)
    }
  }
  async removeNode(instanceId: string, noodpoolid: string): Promise<void> {
    const options = {
      method: 'DELETE',
      url:
        'https://api.vultr.com/v2/kubernetes/clusters/' + this.getClusterId() + '/node-pools/' + noodpoolid + '/nodes/' + instanceId,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getAPIKey(),
      },
    };
    try {
      const response = await axios.request(options);
      if (response.status === 204) {
        return;
      }
      else {
        throw new HttpException(response.statusText, response.status);
      }
    }
    catch (exception) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getAllNodePools.name, exception)
    }
  }
  async removeNodepool(nodepoolId: string): Promise<void> {
    const options = {
      method: 'DELETE',
      url: 'https://api.vultr.com/v2/kubernetes/clusters/' + this.getClusterId() + '/node-pools/' + nodepoolId,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getAPIKey(),
      },
    };
    try {
      const response = await axios.request(options);
      if (response.status === 204) {
        return;
      }
      else {
        throw new HttpException(response.statusText, response.status);
      }
    }
    catch (exception) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getAllNodePools.name, exception)
    }
  }
  async updateNodepool(nodepoolId: string, nodeQuantity: number, maxNodes: number): Promise<void> {
    const options = {
      method: 'PATCH',
      url: 'https://api.vultr.com/v2/kubernetes/clusters/' + this.getClusterId() + '/node-pools/' + nodepoolId,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getAPIKey(),
      },
      data: {
        "node_quantity": nodeQuantity,
        "max_nodes": maxNodes,
      },
    };
    try {
      const response = await axios.request(options);
      console.log(response.data)
      if (response.status === 202) {
        return;
      }
      else {
        throw new HttpException(response.statusText, response.status);
      }
    }
    catch (exception) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getAllNodePools.name, exception)
    }
  }
  async createNodepool(nodeQuantity: number, plan: string, autoScaler: boolean): Promise<void> {
    let maxNodes = this.configService.get<number>('DEFAULT_MAXIMUM_NODES_ON_NEW_NODEPOOL', 4);
    if (nodeQuantity > maxNodes) maxNodes = nodeQuantity;
    const options = {
      method: 'POST',
      url: 'https://api.vultr.com/v2/kubernetes/clusters/' + this.getClusterId() + '/node-pools/',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.getAPIKey(),
      },
      data: {
        "node_quantity": nodeQuantity,
        "label": plan,
        "plan": plan,
        "auto_scaler": autoScaler,
        "min_nodes": this.configService.get<number>('DEFAULT_MINIMUM_NODES_ON_NEW_NODEPOOL', 1),
        "max_nodes": maxNodes,
      },
    };
    try {
      const response = await axios.request(options);
      if (response.status === 201) {
        return;
      }
      else {
        throw new HttpException(response.statusText, response.status);
      }
    }
    catch (exception) {
      ICCException.logError(NotFoundException, this.constructor.name, this.getAllNodePools.name, exception)
    }
  }
  async drainNodes(nodes: NodeDto[]): Promise<void> {
    for (const node of nodes) {
      this.drainNode(node.id);
    }
  }
  async removeNodes(nodes: NodeDto[], nodepoolId: string): Promise<void> {
    for (const node of nodes) {
      this.removeNode(node.id, nodepoolId);
    }
  }
}
