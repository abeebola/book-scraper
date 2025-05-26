import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  UpdateDateColumn,
} from 'typeorm';
import { BookEntity } from '../book/book.entity';
import { BaseAbstractEntity } from '../common/types/entity';
import { RequestStatus, ScrapeRequestResponse } from './scrape.dto';

@Entity('scrape_requests')
export class ScrapeRequestEntity extends BaseAbstractEntity<ScrapeRequestResponse> {
  @Column()
  theme: string;

  @OneToMany(() => BookEntity, (book) => book.request)
  books: BookEntity[];

  @Column({ default: 'pending' satisfies RequestStatus })
  status: RequestStatus;

  @Column({ default: 0 })
  expectedResults: number;

  // Could be tracked elsewhere like Redis or a mutex
  // Only using a DB column for this test.
  @Column({ default: 0 })
  expectedBatches: number;

  // Could be tracked elsewhere like Redis or a mutex
  // Only using a DB column for this test.
  @Column({ default: 0 })
  processedBatches: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  dtoClass = ScrapeRequestResponse;
}
