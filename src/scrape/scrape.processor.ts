import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EnrichDataJob } from './scrape.dto';
import { getSearchUrl, getSearchResults } from './util';
import { InjectRepository } from '@nestjs/typeorm';
import { BookEntity } from './book.entity';
import { Repository } from 'typeorm';

@Processor('book-queue')
export class ScrapeConsumer extends WorkerHost {
  constructor(
    @InjectRepository(BookEntity)
    private readonly repository: Repository<BookEntity>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>) {
    switch (job.name) {
      case 'fetch-books':
        console.info('Running `fetch-books` job');
        return await this.fetchBooks(job.data);
    }
  }

  async fetchBooks(data: EnrichDataJob) {
    const { requestId, theme } = data;
    const urls = [1, 2].map((page) => getSearchUrl(theme, page));

    const result = await Promise.all(urls.map((url) => getSearchResults(url)));

    try {
      await this.repository.save(
        result.flat().map((book) => ({ ...book, requestId })),
      );
    } catch (error) {
      // set request status to failed
      console.error(error);
    }
  }
}
