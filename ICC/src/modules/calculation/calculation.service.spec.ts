import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { ResponseDto } from "src/modules/vultr/dto/response.dto";
import { GlobalService } from 'src/modules/global/global.service'
import { CalculationService } from 'src/modules/calculation/calculation.service'
import { VultrService } from "src/modules/vultr/vultr.service";
import { CreationService } from "src/modules/creation/creation.service";
import { RemovalService } from "src/modules/removal/removal.service";

describe('CalculationSerivce', () => {
    let globalService: GlobalService;
    let service: CalculationService;
    let configService: ConfigService;
    let vultrService: VultrService;
    let creationService: CreationService;
    let removalService: RemovalService;
    let classNameStringForException: string = 'Class: CalculationService'
    let methodNameStringForException: string = 'Method name: '

    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn((key: string, defaultValue: number) => {
                const config = {
                    SCALING_MARGIN: 0.95,
                    REMOVE_AFTER_MINUTE: 50,
                    REMOVE_BEFORE_MINUTE: 55,
                    MINUTES_BETWEEN_ITERATION: 5,
                    DEFAULT_MINIMUM_NODES_ON_NEW_NODEPOOL: 1,
                    DEFAULT_MAXIMUM_NODES_ON_NEW_NODEPOOL: 4,
                    MINIMUM_INDEX_LENGTH_FOR_FORECAST: 3

                };
                return config[key] ?? defaultValue;
            })
        }

        const mockCreationService = {
            nodeCreationProcess: jest.fn()
        }

        const mockGlobalService = {
            calculationIndex: {
                forecast: [],
            },
            minimumIndexLengthForForecast: 3,
            scalingMargin: 0.95,
            getCurrentNRI: jest.fn(() => 8),
            getMinimalIndexOfNodePlansMap: jest.fn(() => 0),
            nodePlansMapHasValidValues: jest.fn(() => true),
            nodePlansMap:
                new Map([
                    ["vhp-2c-2gb-intel", 2],
                    ["vhp-4c-8gb-intel", 4],
                    ["vhp-8c-16gb-intel", 8]
                ]),
        }
        const mockRemovalService = {
            nodeRemovalProcess: jest.fn()
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CalculationService, VultrService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: GlobalService, useValue: mockGlobalService },
                { provide: RemovalService, useValue: mockRemovalService },
                { provide: CreationService, useValue: mockCreationService }
            ],
        }).compile();


        globalService = module.get<GlobalService>(GlobalService)
        service = module.get<CalculationService>(CalculationService)
        configService = module.get<ConfigService>(ConfigService)
        vultrService = module.get<VultrService>(VultrService)
        creationService = module.get<CreationService>(CreationService)
        removalService = module.get<RemovalService>(RemovalService)


        jest.spyOn(console, 'error').mockImplementation(() => { })
    });

    afterEach(() => {
        jest.resetAllMocks();
    })

    it('should be defined', () => {
        expect(globalService).toBeDefined();
        expect(service).toBeDefined();
        expect(configService).toBeDefined();
        expect(vultrService).toBeDefined();
        expect(creationService).toBeDefined();
        expect(removalService).toBeDefined();
    })

    describe('calculateRequiredNodeChanges', () => {
        beforeEach(() => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 10, value: 8, lower: 6 },
                    { time: new Date(), upper: 12, value: 9, lower: 7 },
                    { time: new Date(), upper: 12, value: 9, lower: 7 },
                ]
            })
            const response: ResponseDto = {
                node_pools: [
                    {
                        plan: 'vhp-2c-2gb-intel',
                        node_quantity: 3,
                        id: "id1",
                        auto_scaler: false,
                        max_nodes: 2,
                        min_nodes: 1,
                        label: "",
                        tag: "",
                        status: "",
                        nodes: [
                            {
                                id: "idNode1",
                                label: "label1",
                                status: "status1",
                                date_created: new Date()
                            }
                        ]
                    },
                    {
                        plan: 'vhp-4c-8gb-intel',
                        node_quantity: 2,
                        id: "id2",
                        auto_scaler: false,
                        max_nodes: 2,
                        min_nodes: 1,
                        label: "",
                        tag: "",
                        status: "",
                        nodes: [
                            {
                                id: "idNode2",
                                label: "label2",
                                status: "status2",
                                date_created: new Date()
                            }
                        ]
                    }
                ]
            };
            jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(response)
        })
        it('should throw an NotFoundException since nodePlansMap is null', async () => {
            jest.replaceProperty(globalService, 'nodePlansMap', null);
            let exceptionMessage = 'NodePlansMap not found';
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);
        });
        it('should throw an NotFoundException since nodePlansMap is undefined', async () => {
            jest.replaceProperty(globalService, 'nodePlansMap', undefined);
            let exceptionMessage = 'NodePlansMap not found';
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);
        });
        it('should throw an NotFoundException since nodePlansMap does not have any valid values', async () => {
            jest.spyOn(globalService, 'nodePlansMapHasValidValues').mockReturnValue(false);
            let exceptionMessage = 'NodePlansMap has no valid values or is empty';
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);
        });
        it('should throw an NotFoundException with the calculationIndex being null', async () => {
            Object.defineProperty(globalService, 'calculationIndex', { value: null })
            const exceptionMessage = 'Calculation index not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);
        });
        it('should throw an NotFoundException with the calculationIndex being undefined', async () => {
            Object.defineProperty(globalService, 'calculationIndex', { value: undefined })
            const exceptionMessage = 'Calculation index not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);
        })
        it('should throw an NotFoundException with the forecast being undefined', async () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', { value: undefined })
            const exceptionMessage = 'Calculation index not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);
        })
        it('should throw an NotFoundException with the forecast being empty', async () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', { value: null })
            const exceptionMessage = 'Calculation index not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);
        })
        it('should throw an NotFoundException with the nodePoolList being null', async () => {
            jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(null)
            const exceptionMessage = 'Nodepool list not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);

        })
        it('should throw an NotFoundException with the nodePoolList being undefined', async () => {
            jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(undefined)
            const exceptionMessage = 'Nodepool list not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);

        })
        it('should throw an NotFoundException with the length of the node_poollist being 0', async () => {
            const response: ResponseDto = { node_pools: [] }
            jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(response)
            const exceptionMessage = 'Nodepool list not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);

        })
        it('should throw an NotFoundException with the node_pools list being undefined', async () => {
            const response: ResponseDto = { node_pools: undefined }
            jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(response)
            const exceptionMessage = 'Nodepool list not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);

        })
        it('should throw an NotFoundException with the node_pools list being null', async () => {
            const response: ResponseDto = { node_pools: null }
            jest.spyOn(vultrService, 'getAllNodePools').mockResolvedValue(response)
            const exceptionMessage = 'Nodepool list not found or empty'
            await expect(service.HandleRequiredNodeChanges(globalService.calculationIndex)).rejects.toThrow(new NotFoundException(exceptionMessage))
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.HandleRequiredNodeChanges.name} | Message: ${exceptionMessage}`);

        })
        it('should return and do nothing with difference being 0', async () => {
            jest.spyOn(service, 'getRequiredNRI').mockReturnValue(5);
            jest.spyOn(globalService, 'getCurrentNRI').mockReturnValue(5);

            const spy = await service.HandleRequiredNodeChanges(globalService.calculationIndex)

            const notCalledCreation = jest.spyOn(creationService, 'nodeCreationProcess').mockImplementation(async () => { });
            const notCalledRemoval = jest.spyOn(removalService, 'nodeRemovalProcess').mockImplementation(async () => { });

            expect(notCalledCreation).toHaveBeenCalledTimes(0);
            expect(notCalledRemoval).toHaveBeenCalledTimes(0);
        })
        it('should return and do nothing since the minimal index of the nodePlansMaps is greater than the differenceNRI (which is a negative number)', async () => {
            jest.spyOn(service, 'getRequiredNRI').mockReturnValue(5);
            jest.spyOn(globalService, 'getCurrentNRI').mockReturnValue(6);
            jest.spyOn(globalService, 'getMinimalIndexOfNodePlansMap').mockReturnValue(2)

            const spy = await service.HandleRequiredNodeChanges(globalService.calculationIndex)

            const notCalledCreation = jest.spyOn(creationService, 'nodeCreationProcess').mockImplementation(async () => { });
            const notCalledRemoval = jest.spyOn(removalService, 'nodeRemovalProcess').mockImplementation(async () => { });

            expect(notCalledCreation).toHaveBeenCalledTimes(0);
            expect(notCalledRemoval).toHaveBeenCalledTimes(0);
        })
        it('should call the creation service with differenceNRI being more than 0', async () => {
            jest.spyOn(service, 'getRequiredNRI').mockReturnValue(10);
            jest.spyOn(globalService, 'getCurrentNRI').mockReturnValue(5);
            const spy = jest.spyOn(creationService, 'nodeCreationProcess').mockImplementation(async () => { });

            await service.HandleRequiredNodeChanges(globalService.calculationIndex);

            const notCalledRemoval = jest.spyOn(removalService, 'nodeRemovalProcess').mockImplementation(async () => { });

            expect(spy).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenLastCalledWith(5, expect.anything())
            expect(notCalledRemoval).toHaveBeenCalledTimes(0);
        })
        it('should call the removal service with differenceNRI being less than 0', async () => {
            jest.spyOn(service, 'getRequiredNRI').mockReturnValue(5);
            jest.spyOn(globalService, 'getCurrentNRI').mockReturnValue(10);
            const spy = jest.spyOn(removalService, 'nodeRemovalProcess').mockImplementation(async () => { });

            await service.HandleRequiredNodeChanges(globalService.calculationIndex);

            const notCalledCreation = jest.spyOn(creationService, 'nodeCreationProcess').mockImplementation(async () => { });

            expect(spy).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenLastCalledWith(10, expect.anything())
            expect(notCalledCreation).toHaveBeenCalledTimes(0);
        })
    })

    describe('getRequiredNRI', () => {
        it('should return 12 divided by scaling margin', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 10, average: 8, lower: 6 },
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                    { time: new Date(), upper: 12, average: 8, lower: 6 },
                ]
            })
            expect(service.getRequiredNRI()).toBe(12 / globalService.scalingMargin);
        });
        it('should return 11 divided by the scaling margin', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 10, average: 8, lower: 6 },
                    { time: new Date(), upper: null, average: 8, lower: 6 },
                    { time: new Date(), upper: 11, average: 8, lower: 6 },
                ]
            })
            expect(service.getRequiredNRI()).toBe(11 / globalService.scalingMargin);
        });
        it('should return 13 divided by scaling margin', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 10, average: 8, lower: 6 },
                    { time: new Date(), upper: 13, average: 8, lower: 6 },
                    { time: new Date(), upper: undefined, average: 8, lower: 6 },
                ]
            })
            expect(service.getRequiredNRI()).toBe(13 / globalService.scalingMargin);
        });
        it('should throw NotFoundException when the upper == 0 with only 0', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                ]
            })
            const exceptionMessage = "Upperbound is empty";
            expect(() => service.getRequiredNRI()).toThrow(new NotFoundException(exceptionMessage));
        });
        it('should throw NotFoundException when the upper == 0 with only undefined', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: undefined, average: 8, lower: 6 },
                    { time: new Date(), upper: undefined, average: 8, lower: 6 },
                    { time: new Date(), upper: undefined, average: 8, lower: 6 },
                ]
            })
            const exceptionMessage = "Upperbound is empty";
            expect(() => service.getRequiredNRI()).toThrow(new NotFoundException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getRequiredNRI.name} | Message: ${exceptionMessage}`);

        });
        it('should throw NotFoundException when the upper == 0', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: null, average: 8, lower: 6 },
                    { time: new Date(), upper: null, average: 8, lower: 6 },
                    { time: new Date(), upper: null, average: 8, lower: 6 },
                ]
            })
            const exceptionMessage = "Upperbound is empty";
            expect(() => service.getRequiredNRI()).toThrow(new NotFoundException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getRequiredNRI.name} | Message: ${exceptionMessage}`);

        });
        it('should throw NotFoundException when the upper == 0 with one null and two 0', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                    { time: new Date(), upper: null, average: 8, lower: 6 },
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                ]
            })
            const exceptionMessage = "Upperbound is empty";
            expect(() => service.getRequiredNRI()).toThrow(new NotFoundException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getRequiredNRI.name} | Message: ${exceptionMessage}`);

        });
        it('should throw NotFoundException when the upper == 0 with one undefined and two 0', () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                    { time: new Date(), upper: 0, average: 8, lower: 6 },
                    { time: new Date(), upper: undefined, average: 8, lower: 6 },
                ]
            })
            const exceptionMessage = "Upperbound is empty";
            expect(() => service.getRequiredNRI()).toThrow(new NotFoundException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getRequiredNRI.name} | Message: ${exceptionMessage}`);

        });
        it(`should throw an BadRequestException if forecast length is smaller then the set value`, () => {
            Object.defineProperty(globalService.calculationIndex, 'forecast', {
                value: [
                    { time: new Date(), upper: 10, average: 8, lower: 6 },
                    { time: new Date(), upper: 12, average: 9, lower: 5 },
                ]
            })
            let exceptionMessage = `Forecast length smaller than ${globalService.minimumIndexLengthForForecast}`
            expect(() => service.getRequiredNRI()).toThrow(new BadRequestException(exceptionMessage));
            expect(console.error).toHaveBeenCalledWith(`${classNameStringForException} | ${methodNameStringForException}${service.getRequiredNRI.name} | Message: ${exceptionMessage}`);

        });
    })
})