import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapeRequestEntity } from './scrape-request.entity';
import { ScrapeController } from './scrape.controller';
import { ScrapeService } from './scrape.service';

@Module({
  controllers: [ScrapeController],
  imports: [TypeOrmModule.forFeature([ScrapeRequestEntity])],
  providers: [ScrapeService],
})
export class ScrapeModule {}
