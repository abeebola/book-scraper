import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { BookQueues, FetchBookRequest } from '../book/book.dto';
import { BookEntity } from '../book/book.entity';
import { ScrapeRequestEntity } from './scrape-request.entity';
import { ScrapeRequestDto } from './scrape.dto';

@Injectable()
export class ScrapeService {
  constructor(
    @InjectRepository(ScrapeRequestEntity)
    private readonly repository: Repository<ScrapeRequestEntity>,
    @InjectQueue('book-queue' satisfies BookQueues)
    private readonly bookQueue: Queue,
  ) {}

  async create(dto: ScrapeRequestDto) {
    const entity = this.repository.create(dto);

    try {
      await this.repository.save(entity);

      await this.bookQueue.add('fetch-books', {
        requestId: entity.id,
        theme: dto.theme,
      } satisfies FetchBookRequest);
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException();
    }

    return entity;
  }

  async getById(id: string) {
    const request = await this.repository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Job not found.');
    }

    return request;
  }

  async getBooksByRequestId(requestId: string) {
    const books = await this.repository.manager.find(BookEntity, {
      where: {
        request: {
          id: requestId,
          status: 'done',
        },
      },
    });

    return books;
  }
}
