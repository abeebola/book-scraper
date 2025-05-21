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
    this.originalPrice = entity.originalPrice;
    this.title = entity.title;
    this.url = entity.url;
  }
}
