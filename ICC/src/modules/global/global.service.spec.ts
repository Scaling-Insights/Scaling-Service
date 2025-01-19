import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalService } from 'src/modules/global/global.service';
import { ResponseDto } from 'src/modules/vultr/dto/response.dto';

describe('GlobalService', () => {
  let service: GlobalService;
  let configService: ConfigService;
  const classNameStringForException: string = 'Class: GlobalService';
  const methodNameStringForException: string = 'Method name: ';

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GlobalService>(GlobalService);
    configService = module.get<ConfigService>(ConfigService);

    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('getCurrentNRI', () => {
    it('should throw an exception if nodePoolsList is null', () => {
      const exceptionMessage = 'NodePoolsList is null or undefined';
      expect(() => service.getCurrentNRI(null)).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getCurrentNRI.name} | Message: ${exceptionMessage}`);
    });
    it('should throw an exception if nodePoolsList is undefined', () => {
      const exceptionMessage = 'NodePoolsList is null or undefined';
      expect(() => service.getCurrentNRI(undefined)).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getCurrentNRI.name} | Message: ${exceptionMessage}`);
    });
    it('should throw an exception if nodepoolsList.node_pools is null', () => {
      const exceptionMessage = 'Nodepools are empty or undefined';
      const invalidResponse: ResponseDto = { node_pools: null };
      expect(() => service.getCurrentNRI(invalidResponse)).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getCurrentNRI.name} | Message: ${exceptionMessage}`);
    });
    it('should throw an exception if nodepoolsList.node_pools is undefined', () => {
      const invalidResponse: ResponseDto = { node_pools: undefined };
      const exceptionMessage = 'Nodepools are empty or undefined';
      expect(() => service.getCurrentNRI(invalidResponse)).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getCurrentNRI.name} | Message: ${exceptionMessage}`);
    });
  });

  describe('calculateCurrentNRI', () => {
    it('should throw an exception if nodeplan of nodepool is not in nodePlanMap', () => {
      const invalidResponse: ResponseDto = {
        node_pools: [
          {
            plan: 'unknown-plan',
            node_quantity: 1,
            id: 'id',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [],
          },
        ],
      };
      const exceptionMessage = `Node plan not found in nodePlansMap: unknown-plan`;
      expect(() => service.calculateCurrentNRI(invalidResponse)).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.calculateCurrentNRI.name} | Message: ${exceptionMessage}`);
    });
    it('should return the correct NRI for valid input', () => {
      const response: ResponseDto = {
        node_pools: [
          {
            plan: 'vhp-2c-2gb-intel',
            node_quantity: 3,
            id: 'id',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [],
          },
          {
            plan: 'vhp-4c-8gb-intel',
            node_quantity: 2,
            id: 'id',
            auto_scaler: false,
            max_nodes: 2,
            min_nodes: 1,
            label: '',
            tag: '',
            status: '',
            nodes: [],
          },
        ],
      };

      const result = service.calculateCurrentNRI(response);
      expect(result).toBe(14);
    });
  });
  describe('getMinimalIndexOfNodemaps', () => {
    it('should return 2 with base values', () => expect(service.getMinimalIndexOfNodePlansMap()).toBe(2));
    it('throw exception when nodePlansMap is null', () => {
      jest.replaceProperty(service, 'nodePlansMap', null);
      const exceptionMessage = 'NodePlansMap is empty or undefined';
      expect(() => service.getMinimalIndexOfNodePlansMap()).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getMinimalIndexOfNodePlansMap.name} | Message: ${exceptionMessage}`);
    });
    it('throw exception when nodePlansMap is undefined', () => {
      jest.replaceProperty(service, 'nodePlansMap', undefined);
      const exceptionMessage = 'NodePlansMap is empty or undefined';
      expect(() => service.getMinimalIndexOfNodePlansMap()).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getMinimalIndexOfNodePlansMap.name} | Message: ${exceptionMessage}`);
    });
    it('throw exception when nodePlansMap has a size of 0', () => {
      jest.replaceProperty(service, 'nodePlansMap', new Map());
      const exceptionMessage = 'NodePlansMap is empty or undefined';
      expect(() => service.getMinimalIndexOfNodePlansMap()).toThrow(new NotFoundException(exceptionMessage));
      expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getMinimalIndexOfNodePlansMap.name} | Message: ${exceptionMessage}`);
    });
  });
  describe('nodePlansMapHasValidValues', () => {
    it('should return true if all values of nodePlansMap are Valid', () => {
      expect(service.nodePlansMapHasValidValues()).toBe(true);
    });
    it('should return false if nodePlansMap is empty', () => {
      jest.replaceProperty(service, 'nodePlansMap', new Map());
      expect(service.nodePlansMapHasValidValues()).toBe(false);
    });
    it('should return false', () => {
      jest.replaceProperty(service, 'nodePlansMap', new Map([['hallo', 0]]));
      expect(service.nodePlansMapHasValidValues()).toBe(false);
    });
    it('should return false', () => {
      jest.replaceProperty(service, 'nodePlansMap',
        new Map([
          ['plan', 1],
          ['hallo', 0],
        ]),
      );
      expect(service.nodePlansMapHasValidValues()).toBe(false);
    });
  });
});
