import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntity } from './book.entity';
import { ScrapeRequestEntity } from './scrape-request.entity';
import { ScrapeController } from './scrape.controller';
import { ScrapeConsumer } from './scrape.processor';
import { ScrapeService } from './scrape.service';

@Module({
  controllers: [ScrapeController],
  imports: [
    TypeOrmModule.forFeature([ScrapeRequestEntity, BookEntity]),
    BullModule.registerQueue({ name: 'book-queue' }),
  ],
  providers: [ScrapeService, ScrapeConsumer],
})
export class ScrapeModule {}
