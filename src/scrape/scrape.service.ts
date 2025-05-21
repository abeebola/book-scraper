import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapeRequestEntity } from './scrape-request.entity';
import { ScrapeRequestDto } from './scrape.dto';
import { getSearchResults, getSearchUrl } from './util';

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
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException();
    }

    this.scrape(dto.theme).catch((error) => {
      console.error(error);
    });

    return entity;
  }

  private async scrape(searchTerm: string) {
    const urls = [1, 2].map((page) => getSearchUrl(searchTerm, page));

    const result = await Promise.all(urls.map((url) => getSearchResults(url)));

    console.log(result.flat());
  }
}
