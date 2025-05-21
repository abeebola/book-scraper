import { Column, CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';
import { BaseAbstractEntity } from '../common/types/entity';
import { RequestStatus, ScrapeRequestResponse } from './scrape.dto';

@Entity('scrape_requests')
export class ScrapeRequestEntity extends BaseAbstractEntity<ScrapeRequestResponse> {
  @Column()
  theme: string;

  @Column({ default: 'pending' satisfies RequestStatus })
  status: RequestStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  dtoClass = ScrapeRequestResponse;
}
