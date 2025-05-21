import { Column, Entity } from 'typeorm';
import { BaseAbstractEntity } from '../common/types/entity';
import { BookResponse } from './book.dto';

@Entity('books')
export class BookEntity extends BaseAbstractEntity<BookResponse> {
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

  @Column()
  url: string;

  dtoClass = BookResponse;
}
