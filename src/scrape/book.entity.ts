import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseAbstractEntity } from '../common/types/entity';
import { BookResponse } from './book.dto';
import { ScrapeRequestEntity } from './scrape-request.entity';

@Entity('books')
export class BookEntity extends BaseAbstractEntity<BookResponse> {
  @ManyToOne(() => ScrapeRequestEntity, { onDelete: 'CASCADE' })
  request: string;

  @Column({ type: 'uuid' })
  requestId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  author?: string;

  @Column({ nullable: true })
  originalPrice?: string;

  @Column()
  currentPrice: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  summary?: string;

  @Column({ type: 'decimal', default: 0 })
  relevanceScore: number;

  @Column({ type: 'decimal', default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', default: 0 })
  discountPercentage: number;

  @Column({ type: 'decimal', default: 0 })
  valueScore: number;

  @Column()
  url: string;

  dtoClass = BookResponse;
}
