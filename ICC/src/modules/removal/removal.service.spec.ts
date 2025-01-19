import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';
import { GlobalService } from 'src/modules/global/global.service';
import { VultrService } from 'src/modules/vultr/vultr.service';
import { RemovalService } from 'src/modules/removal/removal.service';
import { NodepoolDto } from 'src/modules/vultr/dto/nodepool.dto';
import { CreationService } from 'src/modules/creation/creation.service';

describe('RemovalService', () => {
  let globalService: GlobalService;
  let service: RemovalService;
  let configService: ConfigService;
  let vultrService: VultrService;
  const classNameStringForException: string = 'Class: RemovalService';
  const methodNameStringForException: string = 'Method name: ';

  let response: ResponseDto;
  let date: Date = new Date();

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue: number) => {
        const config = {
          IGNORED_NODEPOOL_TAGS: ['Database'],
          SCALING_MARGIN: 0.95,
          REMOVE_AFTER_MINUTE: 50,
          REMOVE_BEFORE_MINUTE: 55,
          MINUTES_BETWEEN_ITERATION: 5,
          DEFAULT_MINIMUM_NODES_ON_NEW_NODEPOOL: 1,
          DEFAULT_MAXIMUM_NODES_ON_NEW_NODEPOOL: 4,
          MINIMUM_INDEX_LENGTH_FOR_FORECAST: 3,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const mockGlobalService = {
      nodePlansMap: new Map([
        ['vhp-2c-2gb-intel', 2],
        ['vhp-4c-8gb-intel', 4],
        ['vhp-8c-16gb-intel', 8],
      ]),
      calculationIndex: {
        forecast: [],
      },
      ignoredNodepoolTags: ['Database'],
      minimumIndexLengthForForecast: 3,
      removeBeforeMinute: 55,
      removeAfterMinute: 50,
      getMinimalIndexOfNodePlansMap: jest.fn(() => 2),
    };
    const mockCreationService = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemovalService,
        VultrService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GlobalService, useValue: mockGlobalService },
        { provide: CreationService, useValue: mockCreationService },
      ],
    }).compile();

    globalService = module.get<GlobalService>(GlobalService);
    service = module.get<RemovalService>(RemovalService);
    configService = module.get<ConfigService>(ConfigService);
    vultrService = module.get<VultrService>(VultrService);

    jest.spyOn(vultrService, 'drainNodes').mockImplementation(async () => { });
    jest.spyOn(vultrService, 'removeNodes').mockImplementation(async () => { });
    jest
      .spyOn(vultrService, 'removeNodepool')
      .mockImplementation(async () => { });

    jest.spyOn(console, 'error').mockImplementation(() => { });
    Object.defineProperty(globalService.calculationIndex, 'forecast', {
      value: [
        { time: new Date(), upper: 5, value: 3, lower: 1 },
        { time: new Date(), upper: 7, value: 4, lower: 2 },
        { time: new Date(), upper: 11, value: 6, lower: 3 },
      ],
    });
    date = new Date();
    date.setMinutes(date.getMinutes() - 53);
    response = {
      node_pools: [
        {
          plan: 'vhp-2c-2gb-intel',
          node_quantity: 1,
          id: 'id1',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode1',
              label: 'label1',
              status: 'status1',
              date_created: date,
            },
          ],
        },
        {
          plan: 'vhp-4c-8gb-intel',
          node_quantity: 1,
          id: 'id2',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode2',
              label: 'label2',
              status: 'status2',
              date_created: date,
            },
          ],
        },
      ],
    };
    jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(response);
    date = new Date();
    date.setMinutes(date.getMinutes() - 53);
    response = {
      node_pools: [
        {
          plan: 'vhp-2c-2gb-intel',
          node_quantity: 1,
          id: 'id1',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode1',
              label: 'label1',
              status: 'status1',
              date_created: date,
            },
          ],
        },
        {
          plan: 'vhp-4c-8gb-intel',
          node_quantity: 1,
          id: 'id2',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode2',
              label: 'label2',
              status: 'status2',
              date_created: date,
            },
          ],
        },
      ],
    };
    jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(response);
    date = new Date();
    date.setMinutes(date.getMinutes() - 53);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(globalService).toBeDefined();
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
    expect(vultrService).toBeDefined();
  });
  describe('entire removalProcess', () => {
    it('should complete the entire process of removing both nodes and nodepools', () => {
      const pools = {
        node_pools: [
          {
            plan: 'vhp-2c-2gb-intel',
            node_quantity: 1,
            id: 'id1',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: 'Database',
            status: '',
            nodes: [
              {
                id: 'idNode1',
                label: 'label1',
                status: 'status1',
                date_created: date,
              },
            ],
          },
          {
            plan: 'vhp-2c-2gb-intel',
            node_quantity: 1,
            id: 'id2',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode2',
                label: 'label2',
                status: 'status2',
                date_created: date,
              },
            ],
          },
          {
            plan: 'vhp-4c-8gb-intel',
            node_quantity: 1,
            id: 'id3',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode3',
                label: 'label3',
                status: 'status3',
                date_created: date,
              },
              {
                id: 'idNode4',
                label: 'label4',
                status: 'status4',
                date_created: date,
              },
            ],
          },
          {
            plan: 'vhp-8c-16gb-intel',
            node_quantity: 1,
            id: 'id4',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode5',
                label: 'label5',
                status: 'status5',
                date_created: date,
              },
            ],
          },
        ],
      };
      const currentNRI = 0;
      jest.spyOn(service, 'calculateDifferenceNRIForRemoval').mockReturnValue(13);
      const spyRemoveAll = jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      const spyRemoveSome = jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });
      service.nodeRemovalProcess(currentNRI, pools);
      expect(spyRemoveAll).toHaveBeenCalledTimes(1);
      expect(spyRemoveSome).toHaveBeenCalledTimes(1);
    });
  });

  describe('nodeRemovalProcess', () => {
    it('should throw an NotFoundException since there is no nodepool without the main nodepool tag', () => {
      const pools = {
        node_pools: [
          {
            plan: 'vhp-2c-2gb-intel',
            node_quantity: 1,
            id: 'id1',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: 'Database',
            status: '',
            nodes: [
              {
                id: 'idNode1',
                label: 'label1',
                status: 'status1',
                date_created: date,
              },
            ],
          },
        ],
      };
      const currentNRI = 0;
      const exceptionMessage = 'No nodepools found without the ignored nodepool tags';
      jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });
      expect(() => service.nodeRemovalProcess(currentNRI, pools)).toThrow(new NotFoundException(exceptionMessage),);
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.nodeRemovalProcess.name} | Message: ${exceptionMessage}`);
    });
    it('should throw error when forecast length is smaller than minimumIndexLength', () => {
      const pools = {
        node_pools: [
          {
            plan: 'vhp-2c-2gb-intel',
            node_quantity: 1,
            id: 'id1',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode1',
                label: 'label1',
                status: 'status1',
                date_created: date,
              },
            ],
          },
        ],
      };
      const currentNRI = 0;
      Object.defineProperty(globalService.calculationIndex, 'forecast', {
        value: [
          { time: new Date(), upper: 10, value: 8, lower: 6 },
          { time: new Date(), upper: 12, value: 9, lower: 7 },
        ],
      });
      jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });

      const exceptionMessage = `Forecast length smaller than ${globalService.minimumIndexLengthForForecast}`;
      expect(() => service.nodeRemovalProcess(currentNRI, pools)).toThrow(new NotFoundException(exceptionMessage),);
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.nodeRemovalProcess.name} | Message: ${exceptionMessage}`);
    });
    it('should call once on the method to removeNodesOnTimeLimit eventhough there are two nodes and both need to be deleted', () => {
      const pools = {
        node_pools: [
          {
            plan: 'vhp-2c-2gb-intel',
            node_quantity: 1,
            id: 'id1',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode1',
                label: 'label1',
                status: 'status1',
                date_created: date,
              },
            ],
          },
          {
            plan: 'vhp-4c-8gb-intel',
            node_quantity: 1,
            id: 'id2',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode2',
                label: 'label2',
                status: 'status2',
                date_created: date,
              },
            ],
          },
        ],
      };
      Object.defineProperty(globalService.calculationIndex, 'forecast', {
        value: [
          { time: new Date(), upper: 0, value: 0, lower: 0 },
          { time: new Date(), upper: 0, value: 0, lower: 0 },
          { time: new Date(), upper: 0, value: 0, lower: 0 },
        ],
      });
      const currentNRI = 6;
      jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });
      const spy = jest.spyOn(service, 'removeNodesOnTimeLimit').mockReturnValue(0);
      service.nodeRemovalProcess(currentNRI, pools);
      expect(spy).toHaveBeenCalledTimes(1);
    });
    it('should call on the method to removeNodesOnTimeLimit', () => {
      const pools = {
        node_pools: [
          {
            plan: 'vhp-2c-2gb-intel',
            node_quantity: 1,
            id: 'id1',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode1',
                label: 'label1',
                status: 'status1',
                date_created: date,
              },
            ],
          },
          {
            plan: 'vhp-4c-8gb-intel',
            node_quantity: 1,
            id: 'id2',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [
              {
                id: 'idNode2',
                label: 'label2',
                status: 'status2',
                date_created: date,
              },
            ],
          },
        ],
      };
      Object.defineProperty(globalService.calculationIndex, 'forecast', {
        value: [
          { time: new Date(), upper: 0, value: 0, lower: 0 },
          { time: new Date(), upper: 0, value: 0, lower: 0 },
          { time: new Date(), upper: 0, value: 0, lower: 0 },
        ],
      });
      const currentNRI = 6;
      jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });

      const spy = jest.spyOn(service, 'removeNodesOnTimeLimit').mockReturnValue(5);
      service.nodeRemovalProcess(currentNRI, pools);

      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
  describe('removeNodesOnTimeLimit', () => {
    it('should throw an BadRequestException since the plan of the first nodepool is not in the nodepool map', () => {
      const nodePoolList: NodepoolDto[] = [
        {
          plan: 'vhp-4c-8gb-AMD', //Plan is different
          node_quantity: 2,
          id: 'id1',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode1',
              label: 'label1',
              status: 'status1',
              date_created: date,
            },
          ],
        },
      ];
      const differenceNRIForRemoval = 1;
      jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });

      const exceptionMessage = 'Nodepool plan not found in nodePlansMap';
      expect(() => service.removeNodesOnTimeLimit(nodePoolList, differenceNRIForRemoval),).toThrow(new BadRequestException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.removeNodesOnTimeLimit.name} | Message: ${exceptionMessage}`);
    });
    it('should start the process of removing a nodepool + nodes on that nodepool', () => {
      const nodePoolList: NodepoolDto[] = [
        {
          plan: 'vhp-8c-16gb-intel',
          node_quantity: 1,
          id: 'id1',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode1',
              label: 'label1',
              status: 'status1',
              date_created: date,
            },
          ],
        },
        {
          plan: 'vhp-4c-8gb-intel',
          node_quantity: 3,
          id: 'id2',
          auto_scaler: false,
          max_nodes: 4,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode2',
              label: 'label2',
              status: 'status2',
              date_created: date,
            },
            {
              id: 'idNode3',
              label: 'label3',
              status: 'status3',
              date_created: date,
            },
            {
              id: 'idNode4',
              label: 'label4',
              status: 'status4',
              date_created: date,
            },
          ],
        },
      ];
      const differenceNRIForRemoval = 10;

      const spyRemoveAll = jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockReturnValue();
      const spyRemoveSome = jest.spyOn(service, 'removalProcessOfNodes').mockReturnValue();
      service.removeNodesOnTimeLimit(nodePoolList, differenceNRIForRemoval);

      expect(spyRemoveAll).toHaveBeenCalledTimes(1);
      expect(spyRemoveSome).toHaveBeenCalledTimes(0);
    });
    it('should call removalProcessOfNodes when differenceNRIForRemoval is smaller than nodePoolNRI', () => {
      const nodePoolList: NodepoolDto[] = [
        {
          plan: 'vhp-4c-8gb-intel',
          node_quantity: 2,
          id: 'id1',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode1',
              label: 'label1',
              status: 'status1',
              date_created: date,
            },
            {
              id: 'idNode2',
              label: 'label2',
              status: 'status2',
              date_created: date,
            },
          ],
        },
        {
          plan: 'vhp-2c-2gb-intel',
          node_quantity: 2,
          id: 'id2',
          auto_scaler: false,
          max_nodes: 4,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode3',
              label: 'label3',
              status: 'status3',
              date_created: date,
            },
            {
              id: 'idNode4',
              label: 'label4',
              status: 'status4',
              date_created: date,
            },
          ],
        },
      ];
      const differenceNRIForRemoval = 6;
      const spyRemoveAll = jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      const spyRemoveSome = jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });
      service.removeNodesOnTimeLimit(nodePoolList, differenceNRIForRemoval);

      expect(spyRemoveSome).toHaveBeenCalledTimes(2);
      expect(spyRemoveAll).toHaveBeenCalledTimes(0);
    });
    it('should not start removal process for nodes for second nodepool', () => {
      const nodePoolList: NodepoolDto[] = [
        {
          plan: 'vhp-4c-8gb-intel',
          node_quantity: 1,
          id: 'id1',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode1',
              label: 'label1',
              status: 'status1',
              date_created: date,
            },
          ],
        },
        {
          plan: 'vhp-2c-2gb-AMD',
          node_quantity: 2,
          id: 'id2',
          auto_scaler: false,
          max_nodes: 4,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode2',
              label: 'label2',
              status: 'status2',
              date_created: date,
            },
            {
              id: 'idNode3',
              label: 'label3',
              status: 'status3',
              date_created: date,
            },
          ],
        },
      ];
      const differenceNRIForRemoval = 10;
      const spyRemoveAll = jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      const spyRemoveSome = jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });
      service.removeNodesOnTimeLimit(nodePoolList, differenceNRIForRemoval);

      expect(spyRemoveSome).toHaveBeenCalledTimes(0);
      expect(spyRemoveAll).toHaveBeenCalledTimes(1);
    });
    it('should not start removal process for nodes', () => {
      const nodePoolList: NodepoolDto[] = [
        {
          plan: 'vhp-4c-8gb-intel',
          node_quantity: 1,
          id: 'id1',
          auto_scaler: false,
          max_nodes: 2,
          min_nodes: 1,
          label: '',
          tag: '',
          status: '',
          nodes: [
            {
              id: 'idNode1',
              label: 'label1',
              status: 'status1',
              date_created: new Date(),
            },
            {
              id: 'idNode2',
              label: 'label2',
              status: 'status2',
              date_created: new Date(),
            },
          ],
        },
      ];

      const differenceNRIForRemoval = 6;
      const spyRemoveAll = jest.spyOn(service, 'removalProcessOfAllNodesOfAPool').mockImplementation(() => { });
      const spyRemoveSome = jest.spyOn(service, 'removalProcessOfNodes').mockImplementation(() => { });
      service.removeNodesOnTimeLimit(nodePoolList, differenceNRIForRemoval);

      expect(spyRemoveSome).toHaveBeenCalledTimes(0);
      expect(spyRemoveAll).toHaveBeenCalledTimes(0);
    });
  });
  describe('calculateDifferenceNRIForRemoval', () => {
    it('should return highest upper value from first three forecasts', () => {
      expect(service.calculateDifferenceNRIForRemoval(15)).toBe(4);
    });
    it('should return 2 when difference in NRI is 0', () => {
      Object.defineProperty(globalService.calculationIndex, 'forecast', {
        value: [
          { time: new Date(), upper: 0, value: 3, lower: 1 },
          { time: new Date(), upper: 0, value: 4, lower: 2 },
          { time: new Date(), upper: 0, value: 6, lower: 3 },
        ],
      });
      expect(service.calculateDifferenceNRIForRemoval(4)).toBe(2);
    });
  });
});

