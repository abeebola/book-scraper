import { ApiProperty } from '@nestjs/swagger';
import { AbstractDto } from '../common/types/dto';
import { BookEntity } from './book.entity';

export class BookResponse extends AbstractDto {
  @ApiProperty({ description: 'Book title', example: 'The Hobbit' })
  title: string;

  @ApiProperty({ description: 'Book author', example: 'J. R. R. Tolkein' })
  author?: string;

  @ApiProperty({ description: 'Original price', example: '$45' })
  originalPrice?: string;

  @ApiProperty({ description: 'Discounted price', example: '$36' })
  currentPrice: string;

  @ApiProperty({ description: 'Book Description', example: 'Awesome.' })
  description?: string;

  @ApiProperty({ description: 'Book summary', example: 'Very nice.' })
  summary?: string;

  @ApiProperty({ example: 92.3 })
  relevanceScore: number;

  @ApiProperty({ example: 18.65 })
  discountAmount: number;

  @ApiProperty({ example: 12 })
  discountPercentage: number;

  @ApiProperty({ example: 0.18 })
  valueScore: number;

  @ApiProperty({
    description: 'Book URL',
    example: 'https://book.com/sample-book',
  })
  url: string;

  constructor(entity: BookEntity) {
    super(entity);

    this.author = entity.author;
    this.currentPrice = entity.currentPrice;
    this.description = entity.description;
    this.discountAmount = entity.discountAmount;
    this.discountPercentage = entity.discountPercentage;
    this.originalPrice = entity.originalPrice;
    this.relevanceScore = entity.relevanceScore;
    this.summary = entity.summary;
    this.title = entity.title;
    this.url = entity.url;
    this.valueScore = entity.valueScore;
  }
}
