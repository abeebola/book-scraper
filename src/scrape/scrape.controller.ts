import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { ScrapeRequestDto, ScrapeRequestResponse } from './scrape.dto';
import { ScrapeService } from './scrape.service';

@Controller('scrape')
export class ScrapeController {
  constructor(private readonly service: ScrapeService) {}

  @Post()
  @ApiCreatedResponse({ type: ScrapeRequestResponse })
  async create(@Body() dto: ScrapeRequestDto) {
    const result = await this.service.create(dto);

    return {
      message:
        'Request processing. Please use the job ID to track this request',
      data: result.toDto(),
    };
  }
}
