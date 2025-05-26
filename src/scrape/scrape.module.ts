import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookEntity } from '../book/book.entity';
import { ScrapeRequestEntity } from './scrape-request.entity';
import { ScrapeController } from './scrape.controller';
import { ScrapeService } from './scrape.service';

@Module({
  controllers: [ScrapeController],
  imports: [
    TypeOrmModule.forFeature([ScrapeRequestEntity, BookEntity]),
    BullModule.registerQueue({ name: 'book-queue' }),
    HttpModule,
  ],
  providers: [ScrapeService],
})
export class ScrapeModule {}
