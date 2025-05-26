import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapeRequestEntity } from '../scrape/scrape-request.entity';
import { BookQueues } from './book.dto';
import { BookEntity } from './book.entity';
import {
  BookConsumer,
  BookDescriptionConsumer,
  DataEnrichmentConsumer,
} from './book.processor';
import { BookService } from './book.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'book-queue' satisfies BookQueues }),
    BullModule.registerQueue({
      name: 'book-description-queue' satisfies BookQueues,
    }),
    BullModule.registerQueue({
      name: 'data-enrichment-queue' satisfies BookQueues,
    }),
    BullModule.registerQueue({
      name: 'trigger-document-update-webhook' satisfies BookQueues,
    }),

    HttpModule,
    TypeOrmModule.forFeature([BookEntity, ScrapeRequestEntity]),
  ],
  providers: [
    BookConsumer,
    BookDescriptionConsumer,
    DataEnrichmentConsumer,
    BookService,
  ],
})
export class BookModule {}
