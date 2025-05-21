import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapeRequestEntity } from './scrape-request.entity';
import { ScrapeRequestDto } from './scrape.dto';

@Injectable()
export class ScrapeService {
  constructor(
    @InjectRepository(ScrapeRequestEntity)
    private readonly repository: Repository<ScrapeRequestEntity>,
  ) {}

  async create(dto: ScrapeRequestDto) {
    const entity = this.repository.create(dto);

    try {
      await this.repository.save(entity);

      return entity;
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException();
    }
  }
}
