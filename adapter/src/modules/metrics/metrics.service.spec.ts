import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../../modules/metrics/metrics.service';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import { AppDataSource } from '../../database/data-source';
import { Metrics } from '../../shared/entities/metrics.entity';
import { PromQLQueryHandler } from '../../modules/metrics/promql-query/handlers/promql-query-handler.interface';

jest.mock('axios');
jest.mock('../../database/data-source');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAppDataSource = AppDataSource as jest.Mocked<typeof AppDataSource>;

describe('MetricsService', () => {
  let service: MetricsService;
  let configService: jest.Mocked<ConfigService>;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
  let queryHandlers: jest.Mocked<PromQLQueryHandler[]>;

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    schedulerRegistry = {
      addInterval: jest.fn(),
    } as unknown as jest.Mocked<SchedulerRegistry>;

    queryHandlers = [
      {
        queryName: 'query1',
        fetchAndProcess: jest.fn(),
      },
      {
        queryName: 'query2',
        fetchAndProcess: jest.fn(),
      },
    ] as jest.Mocked<PromQLQueryHandler[]>;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: ConfigService, useValue: configService },
        { provide: SchedulerRegistry, useValue: schedulerRegistry },
        { provide: 'PromQLQueryHandlers', useValue: queryHandlers },
      ],
    }).compile();

    service = moduleRef.get<MetricsService>(MetricsService);
  });

  it('should collect and process metrics', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'PROM_URL') return 'http://prometheus.test';
      if (key === 'query1') return 'cpu_usage';
      if (key === 'query2') return 'ram_usage';
      return null;
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: 'mockData1',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        url: '',
      },
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: 'mockData2',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        url: '',
      },
    });

    await service['collectMetrics']();

    expect(configService.get).toHaveBeenCalledWith('PROM_URL');
    expect(mockedAxios.get).toHaveBeenCalledWith('http://prometheus.test?query=cpu_usage');
    expect(mockedAxios.get).toHaveBeenCalledWith('http://prometheus.test?query=ram_usage');
    expect(queryHandlers[0].fetchAndProcess).toHaveBeenCalledWith('mockData1', expect.any(Metrics));
    expect(queryHandlers[1].fetchAndProcess).toHaveBeenCalledWith('mockData2', expect.any(Metrics));
  });

  it('should save metrics to the database', async () => {
    const mockSave = jest.fn();
    const mockFind = jest.fn().mockResolvedValue([{ id: 1, time: new Date() }]);

    mockedAppDataSource.getRepository.mockReturnValue({
      save: mockSave,
      find: mockFind,
    } as any);

    const metrics = new Metrics();
    metrics.time = new Date();

    await service['saveMetricsToDatabase'](metrics);

    expect(mockSave).toHaveBeenCalledWith(metrics);
    expect(mockFind).toHaveBeenCalled();
  });

  it('should handle missing PROM_URL in config', async () => {
    configService.get.mockReturnValueOnce(null);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await service['collectMetrics']();

    expect(consoleSpy).toHaveBeenCalledWith('PROM_URL not found in config');
  });

  it('should handle invalid query in config', async () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'PROM_URL') return 'http://prometheus.test';
      if (key === 'query1') return '';
      return null;
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await service['collectMetrics']();

    expect(consoleSpy).toHaveBeenCalledWith('No query found for query1');
  });

  it('should throw error if metrics are invalid in saveMetricsToDatabase', async () => {
    await expect(service['saveMetricsToDatabase'](null as any)).rejects.toThrow('Metrics object is required');
  });

  it('should parse interval correctly', () => {
    const interval = '10';
    const result = service['parseIntervalToMs'](interval);

    expect(result).toBe(10000);
  });

  it('should throw error for invalid interval format', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => service['parseIntervalToMs']('invalid')).toThrow('Invalid CRON_INTERVAL format');
    expect(consoleSpy).toHaveBeenCalledWith('Invalid CRON_INTERVAL format');
  });

  it('should throw error if invalid cron interval is provided in onModuleInit', async () => {
    configService.get.mockReturnValueOnce('invalid');

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await expect(service.onModuleInit()).rejects.toThrow('Invalid CRON_INTERVAL format');
    expect(consoleSpy).toHaveBeenCalledWith('Invalid CRON_INTERVAL format');
  });
});
