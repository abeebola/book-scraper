import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { BookResponse } from '../book/book.dto';
import { ScrapeRequestDto, ScrapeRequestResponse } from './scrape.dto';
import { ScrapeService } from './scrape.service';

@Controller()
export class ScrapeController {
  constructor(private readonly service: ScrapeService) {}

  @Post('scrape')
  @ApiCreatedResponse({ type: ScrapeRequestResponse })
  async create(@Body() dto: ScrapeRequestDto) {
    const result = await this.service.create(dto);

    return {
      message:
        'Request processing. Please use the job ID to track this request',
      data: result.toDto(),
    };
  }

  @Get('results/:id')
  @ApiOkResponse({ type: BookResponse, isArray: true })
  async getBooks(@Param('id', ParseUUIDPipe) id: string) {
    const results = await this.service.getBooksByRequestId(id);

    return results.map((x) => x.toDto());
  }

  @Get('status/:id')
  @ApiOkResponse({ type: ScrapeRequestResponse })
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.service.getById(id);

    return result.toDto();
  }
}
