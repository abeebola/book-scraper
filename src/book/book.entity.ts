import { AfterLoad, Column, Entity, ManyToOne } from 'typeorm';
import { BaseAbstractEntity } from '../common/types/entity';
import { BookResponse } from './book.dto';
import { ScrapeRequestEntity } from '../scrape/scrape-request.entity';

@Entity('books')
export class BookEntity extends BaseAbstractEntity<BookResponse> {
  @ManyToOne(() => ScrapeRequestEntity, { onDelete: 'CASCADE' })
  request: ScrapeRequestEntity;

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

  @AfterLoad()
  formatAmounts() {
    this.discountAmount &&
      (this.discountAmount = parseFloat(this.discountAmount.toString()));

    this.discountPercentage &&
      (this.discountPercentage = parseFloat(
        this.discountPercentage.toString(),
      ));

    this.relevanceScore &&
      (this.relevanceScore = parseFloat(this.relevanceScore.toString()));

    this.valueScore &&
      (this.valueScore = parseFloat(this.valueScore.toString()));
  }

  dtoClass = BookResponse;
}
