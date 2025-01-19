import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalService } from 'src/modules/global/global.service';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { VultrService } from 'src/modules/vultr/vultr.service';
import { CreationService } from 'src/modules/creation/creation.service';

describe('CreationService', () => {
  let service: CreationService;
  let vultrService: VultrService;
  let globalService: GlobalService;
  const classNameStringForException: string = 'Class: CreationService';
  const methodNameStringForException: string = 'Method name: ';
  let response: ResponseDto;

  const setResponse = (nodeQuantity: number, maxNodes: number) => {
    response = {
      node_pools: [
        {
          plan: 'vhp-2c-2gb-intel',
          node_quantity: nodeQuantity,
          id: 'id',
          auto_scaler: false,
          max_nodes: maxNodes,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [],
        },
      ],
    };
  };

  beforeEach(async () => {
    const mockGlobalService = {
      nodePlansMap: new Map([
        ['vhp-2c-2gb-intel', 2],
        ['vhp-4c-8gb-intel', 4],
        ['vhp-8c-16gb-intel', 8],
      ]),
      calculationIndex: {
        forecast: [
          { time: new Date(), upper: 10, value: 8, lower: 6 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 }, // <-- important for GetNewNodePlanCombination
          { time: new Date(), upper: 12, value: 9, lower: 7 },
        ],
      },
      getCurrentNRI: jest.fn(() => 8),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreationService,
        VultrService,
        { provide: GlobalService, useValue: mockGlobalService },
      ],
    }).compile();

    service = module.get<CreationService>(CreationService);
    vultrService = module.get<VultrService>(VultrService);
    globalService = module.get<GlobalService>(GlobalService);

    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(vultrService).toBeDefined();
    expect(globalService).toBeDefined();
  });

  describe('nodeCreationProcess', () => {
    it('should throw an exception if retrieved nodePlans is null', async () => {
      jest.spyOn(service, 'getNewNodeplanCombination').mockResolvedValue(null);
      const exceptionMessage = 'No nodeplans found';
      setResponse(3, 3);
      await expect(service.nodeCreationProcess(10, response)).rejects.toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.nodeCreationProcess.name} | Message: ${exceptionMessage}`);
    });
    it('should throw an exception if the length of retrieved nodePlans is 0', async () => {
      jest.spyOn(service, 'getNewNodeplanCombination').mockResolvedValue(new Map());
      const exceptionMessage = 'No nodeplans found';
      await expect(service.nodeCreationProcess(10, response)).rejects.toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.nodeCreationProcess.name} | Message: ${exceptionMessage}`);
    });
    //Kan falen door verandering van max_nodes en/of node_quantity
    it('should use updateNodepool if the nodepool already excists', async () => {
      const id: string = 'id';
      const nodeQuantity: number = 3;
      const nodeQuantityChange: number = 1;
      setResponse(nodeQuantity, nodeQuantity);
      jest.spyOn(service, 'getNewNodeplanCombination').mockResolvedValue(new Map([['vhp-2c-2gb-intel', nodeQuantityChange]]));
      const notcalled = jest.spyOn(vultrService, 'createNodepool').mockResolvedValue();
      const spy = jest.spyOn(vultrService, 'updateNodepool').mockResolvedValue();
      await service.nodeCreationProcess(2, response);
      expect(spy).toHaveBeenCalledWith(id, nodeQuantity + nodeQuantityChange, nodeQuantity + nodeQuantityChange);
      expect(notcalled).toHaveBeenCalledTimes(0);
    });
    it("should use createNodepool if the nodepool doesn't excists", async () => {
      const nodeQuantityChange: number = 1;
      const nodePlan: string = 'vhp-4c-8gb-intel';
      setResponse(3, 3);
      jest.spyOn(service, 'getNewNodeplanCombination').mockResolvedValue(new Map([[nodePlan, nodeQuantityChange]]));
      const spy = jest.spyOn(vultrService, 'createNodepool').mockResolvedValue();
      const notcalled = jest.spyOn(vultrService, 'updateNodepool').mockResolvedValue();
      await service.nodeCreationProcess(2, response);
      expect(spy).toHaveBeenCalledWith(nodeQuantityChange, nodePlan, true);
      expect(notcalled).toHaveBeenCalledTimes(0);
    });
    it('should call updateNodepool and createNodepool when forecast in 55 minutes is higer and diff , all methodes are called', async () => {
      const updateNodepoolSpy = jest.spyOn(vultrService, 'updateNodepool').mockResolvedValue();
      const createNodepoolSpy = jest.spyOn(vultrService, 'createNodepool').mockResolvedValue();
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 1.5],
          ['vhp-8c-16gb-intel', 5],
        ]),
      );
      const differenceNRI = 10;
      const id = 'id';
      const nodeQuantity = 4;
      const nodeQuantityChange = 1;
      setResponse(nodeQuantity, nodeQuantity);
      await service.nodeCreationProcess(differenceNRI, response);
      expect(updateNodepoolSpy).toHaveBeenCalledWith(id, nodeQuantity + nodeQuantityChange, nodeQuantity + nodeQuantityChange);
      expect(createNodepoolSpy).toHaveBeenCalledWith(
        2,
        'vhp-4c-8gb-intel',
        true,
      );
    });
    it('should call updateNodepool, no mocked functions', async () => {
      const updateNodepoolSpy = jest.spyOn(vultrService, 'updateNodepool').mockResolvedValue();
      const createNodepoolSpy = jest.spyOn(vultrService, 'createNodepool').mockResolvedValue();
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 1.5],
          ['vhp-8c-16gb-intel', 5],
        ]),
      );
      const id = 'id';
      const differenceNRI = 2;
      const nodeQuantity = 4;
      const nodeQuantityChange = 1;
      setResponse(nodeQuantity, nodeQuantity);
      await service.nodeCreationProcess(differenceNRI, response);
      expect(updateNodepoolSpy).toHaveBeenCalledWith(id, nodeQuantity + nodeQuantityChange, nodeQuantity + nodeQuantityChange);
      expect(createNodepoolSpy).toHaveBeenCalledTimes(0);
    });
    it('should call createNodepool, all methodes are called', async () => {
      const updateNodepoolSpy = jest.spyOn(vultrService, 'updateNodepool').mockResolvedValue();
      const createNodepoolSpy = jest.spyOn(vultrService, 'createNodepool').mockResolvedValue();
      jest.replaceProperty(globalService, 'calculationIndex', {
        forecast: [
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
          { time: new Date(), upper: 12, value: 9, lower: 7 }, // <-- important for GetNewNodePlanCombination
          { time: new Date(), upper: 12, value: 9, lower: 7 },
        ],
      });

      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 1.5],
          ['vhp-8c-16gb-intel', 5],
        ]),
      );
      const differenceNRI = 8;
      const nodeQuantity = 4;
      setResponse(nodeQuantity, nodeQuantity);
      await service.nodeCreationProcess(differenceNRI, response);
      expect(updateNodepoolSpy).toHaveBeenCalledTimes(0);
      expect(createNodepoolSpy).toHaveBeenCalledWith(2, 'vhp-4c-8gb-intel', true);
    });
  });
  describe('getNewNodeplanCombination', () => {
    it('should call recursiveGetPossiblePlans and getCheapestNodeplanCombination once when diff is negative', async () => {
      jest.spyOn(globalService, 'getCurrentNRI').mockReturnValue(14);
      const cheapest = new Map([
        ['vhp-2c-2gb-intel', 1],
        ['vhp-4c-8gb-intel', 1],
        ['vhp-8c-16gb-intel', 0],
      ]);
      const recurisePlansSpy = jest.spyOn(service, 'recursiveGetPossiblePlans').mockReturnValue(null);
      const cheapestPlanSpy = jest.spyOn(service, 'getCheapestNodeplanCombination').mockResolvedValue(cheapest);
      setResponse(3, 3);
      const result = await service.getNewNodeplanCombination(1, response);
      expect(result).toBe(cheapest);
      expect(recurisePlansSpy).toHaveBeenCalledTimes(1);
      expect(cheapestPlanSpy).toHaveBeenCalledTimes(1);
    });
    it('should call recursiveGetPossiblePlans and getCheapestNodeplanCombination once when diff is 0', async () => {
      jest.spyOn(globalService, 'getCurrentNRI').mockReturnValue(12);
      const cheapest = new Map([
        ['vhp-2c-2gb-intel', 1],
        ['vhp-4c-8gb-intel', 1],
        ['vhp-8c-16gb-intel', 0],
      ]);
      const recurisePlansSpy = jest.spyOn(service, 'recursiveGetPossiblePlans').mockReturnValue(null);
      const cheapestPlanSpy = jest.spyOn(service, 'getCheapestNodeplanCombination').mockResolvedValue(cheapest);
      setResponse(3, 3);
      const result = await service.getNewNodeplanCombination(1, response);

      expect(result).toBe(cheapest);
      expect(recurisePlansSpy).toHaveBeenCalledTimes(1);
      expect(cheapestPlanSpy).toHaveBeenCalledTimes(1);
    });
    it('should call recursiveGetPossiblePlans and getCheapestNodeplanCombination twice when diff is positive', async () => {
      jest.spyOn(globalService, 'getCurrentNRI').mockReturnValue(8);
      const cheapest = new Map([
        ['vhp-2c-2gb-intel', 1],
        ['vhp-4c-8gb-intel', 0],
        ['vhp-8c-16gb-intel', 0],
      ]);
      const cheapestDownScale = new Map([
        ['vhp-2c-2gb-intel', 2],
        ['vhp-4c-8gb-intel', 0],
        ['vhp-8c-16gb-intel', 0],
      ]);
      const recurisePlansSpy = jest.spyOn(service, 'recursiveGetPossiblePlans').mockReturnValue(null);
      const cheapestPlanSpy = jest.spyOn(service, 'getCheapestNodeplanCombination').mockResolvedValue(cheapestDownScale).mockResolvedValueOnce(cheapest);
      setResponse(3, 3);

      const result = await service.getNewNodeplanCombination(1, response);

      expect(result.get('vhp-2c-2gb-intel')).toBe(3);
      expect(recurisePlansSpy).toHaveBeenCalledTimes(2);
      expect(cheapestPlanSpy).toHaveBeenCalledTimes(2);
    });
  });
  describe('getCheapestNodeplanCombination', () => {
    it('should throw an exception if possibleCombinations is null', async () => {
      const exceptionMessage = 'No plan combinations found or is empty';
      await expect(service.getCheapestNodeplanCombination(null),).rejects.toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getCheapestNodeplanCombination.name} | Message: ${exceptionMessage}`);
    });
    it('should return the cheapest combination from the mocked results', async () => {
      const results: number[] = [5, 6.5, 3, 6, 2.5, 10, 3.5, 3];

      results.forEach((numb) => {
        jest.spyOn(service, 'calculateNodeplanCombinationPrice').mockResolvedValueOnce(numb);
      });

      const cheapest = new Map([
        ['vhp-2c-2gb-intel', 1],
        ['vhp-4c-8gb-intel', 1],
        ['vhp-8c-16gb-intel', 0],
      ]);

      const possibleCombinations = [
        new Map([
          ['vhp-2c-2gb-intel', 0],
          ['vhp-4c-8gb-intel', 0],
          ['vhp-8c-16gb-intel', 1],
        ]),
        new Map([
          ['vhp-2c-2gb-intel', 0],
          ['vhp-4c-8gb-intel', 1],
          ['vhp-8c-16gb-intel', 1],
        ]),
        new Map([
          ['vhp-2c-2gb-intel', 0],
          ['vhp-4c-8gb-intel', 2],
          ['vhp-8c-16gb-intel', 0],
        ]),
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 0],
          ['vhp-8c-16gb-intel', 1],
        ]),
        cheapest,
        new Map([
          ['vhp-2c-2gb-intel', 2],
          ['vhp-4c-8gb-intel', 0],
          ['vhp-8c-16gb-intel', 1],
        ]),
        new Map([
          ['vhp-2c-2gb-intel', 2],
          ['vhp-4c-8gb-intel', 1],
          ['vhp-8c-16gb-intel', 0],
        ]),
        new Map([
          ['vhp-2c-2gb-intel', 3],
          ['vhp-4c-8gb-intel', 0],
          ['vhp-8c-16gb-intel', 0],
        ]),
      ];

      const result = await service.getCheapestNodeplanCombination(possibleCombinations);
      expect(result).toBe(cheapest);
    });
  });
  describe('calculateNodeplanCombinationPrice', () => {
    it('should throw an exception if fetched node plans is null', async () => {
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(null);
      const nodePlan = new Map([['vhp-2c-2gb-intel', 1]]);
      const exceptionMessage = 'Plans not found or empty';
      await expect(service.calculateNodeplanCombinationPrice(nodePlan),).rejects.toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.calculateNodeplanCombinationPrice.name} | Message: ${exceptionMessage}`);
    });
    it('should throw an exception if no node plans can be fetched', async () => {
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(new Map());
      const nodePlan = new Map([['vhp-2c-2gb-intel', 1]]);
      const exceptionMessage = 'Plans not found or empty';
      await expect(service.calculateNodeplanCombinationPrice(nodePlan),).rejects.toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.calculateNodeplanCombinationPrice.name} | Message: ${exceptionMessage}`);
    });
    it('should return a price of 1 for a plan combination with 1 vhp-2c-2gb-intel', () => {
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 1.5],
          ['vhp-8c-16gb-intel', 5],
        ]),
      );
      const nodePlan = new Map([['vhp-2c-2gb-intel', 1]]);
      expect(service.calculateNodeplanCombinationPrice(nodePlan)).resolves.toBe(1);
    });
    it('should return a price of 3.5 for a plan combination with 2 vhp-2c-2gb-intel and 1 vhp-4c-8gb-intel', () => {
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 1.5],
          ['vhp-8c-16gb-intel', 5],
        ]),
      );
      const nodePlan = new Map([
        ['vhp-2c-2gb-intel', 2],
        ['vhp-4c-8gb-intel', 1],
      ]);
      expect(service.calculateNodeplanCombinationPrice(nodePlan)).resolves.toBe(3.5);
    });
    it('should return a price of 7 for a plan combination with 2 vhp-2c-2gb-intel and 1 vhp-8c-16gb-intel', () => {
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 1.5],
          ['vhp-8c-16gb-intel', 5],
        ]),
      );
      const nodePlan = new Map([
        ['vhp-2c-2gb-intel', 2],
        ['vhp-8c-16gb-intel', 1],
      ]);
      expect(service.calculateNodeplanCombinationPrice(nodePlan)).resolves.toBe(7);
    });
    it('should return a price of 12.5 for a plan combination with 1 vhp-2c-2gb-intel, 1 vhp-4c-8gb-intel and 2 vhp-8c-16gb-intel', async () => {
      jest.spyOn(vultrService, 'fetchPlans').mockResolvedValue(
        new Map([
          ['vhp-2c-2gb-intel', 1],
          ['vhp-4c-8gb-intel', 1.5],
          ['vhp-8c-16gb-intel', 5],
        ]),
      );
      const nodePlan = new Map([
        ['vhp-2c-2gb-intel', 1],
        ['vhp-4c-8gb-intel', 1],
        ['vhp-8c-16gb-intel', 2],
      ]);
      expect(await service.calculateNodeplanCombinationPrice(nodePlan)).toBe(12.5);
    });
  });
  describe('recursiveGetPossiblePlans', () => {
    it('should possibleCombinations length of 1 when needed index is 0', () => {
      const possibleCombinations: Map<string, number>[] = [];
      const startingRecord: Map<string, number> = new Map();

      globalService.nodePlansMap.forEach(function (_, key) {
        startingRecord.set(key, 0);
      });
      service.recursiveGetPossiblePlans(0, possibleCombinations, startingRecord);
      expect(possibleCombinations.length).toBe(1);
    });
    it('should possibleCombinations length of 3 when needed index is 1', () => {
      const possibleCombinations: Map<string, number>[] = [];
      const startingRecord: Map<string, number> = new Map();

      globalService.nodePlansMap.forEach(function (_, key) {
        startingRecord.set(key, 0);
      });
      service.recursiveGetPossiblePlans(1, possibleCombinations, startingRecord);
      expect(possibleCombinations.length).toBe(3);
    });
    it('should possibleCombinations length of 3 when needed index is 5', () => {
      const possibleCombinations: Map<string, number>[] = [];
      const startingRecord: Map<string, number> = new Map();

      globalService.nodePlansMap.forEach(function (_, key) {
        startingRecord.set(key, 0);
      });
      service.recursiveGetPossiblePlans(5, possibleCombinations, startingRecord);
      expect(possibleCombinations.length).toBe(8);
    });
    it('should add no nodeplan combinations to possibleCombinations', () => {
      const possibleCombinations: Map<string, number>[] = [];
      const startingRecord: Map<string, number> = new Map();
      jest.replaceProperty(globalService, 'nodePlansMap', new Map());

      globalService.nodePlansMap.forEach(function (_, key) {
        startingRecord.set(key, 0);
      });
      service.recursiveGetPossiblePlans(5, possibleCombinations, startingRecord);
      expect(possibleCombinations.length).toBe(0);
    });
  });
});
