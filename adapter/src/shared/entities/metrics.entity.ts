import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Metrics {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: bigint;

    @Column('float')
    total_cpu: number

    @Column('float')
    avg_usage_cpu: number

    @Column('float')
    total_ram: number

    @Column('float')
    avg_usage_ram: number

    @Column({ type: 'float', nullable: true })
    average_request: number | null;

    @Column({ type: 'float', nullable: true })
    average_latency_request: number | null;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    time: Date;

    @Column('int')
    nodecount: number;
} 