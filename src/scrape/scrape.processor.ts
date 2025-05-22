import { InjectFlowProducer, Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { FlowChildJob, FlowProducer, Job } from 'bullmq';
import { Repository } from 'typeorm';
import { BookEntity } from './book.entity';
import { EnrichDataJob } from './scrape.dto';
import { getNewBrowserContext } from './utils/browser';
import {
  getBookDescription,
  getSearchResults,
  getSearchUrl,
} from './utils/scraper';

@Processor('book-queue')
export class ScrapeConsumer extends WorkerHost {
  constructor(
    @InjectRepository(BookEntity)
    private readonly repository: Repository<BookEntity>,
    @InjectFlowProducer('book-producer')
    private readonly bookProducer: FlowProducer,
  ) {
    super();
  }

  async process(job: Job<any, any, string>) {
    console.info(`Running ${job.name} job`);

    switch (job.name) {
      case 'fetch-books':
        return await this.fetchBooks(job.data);

      case 'fetch-description':
        return await this.fetchDescription(job.data);

      case 'enrich-book-data':
        return this.enrichBookData(job);
    }
  }

  async fetchBooks(data: EnrichDataJob) {
    const { requestId, theme } = data;
    const urls = [1].map((page) => getSearchUrl(theme, page));
    // TODO: Uncomment before final push
    // const urls = [1, 2].map((page) => getSearchUrl(theme, page));

    const result = await Promise.all(urls.map((url) => getSearchResults(url)));

    const books = result.flat().map((book) => ({ ...book, requestId }));

    const BATCH_SIZE = 6;

    const childJobs: FlowChildJob[] = [];

    while (books.length) {
      const batchAmount = Math.min(books.length, BATCH_SIZE);
      const batch = books.splice(0, batchAmount);
      childJobs.push({
        name: 'fetch-description',
        queueName: 'book-queue',
        data: batch,
      });
    }

    console.log({ childJobs });

    await this.bookProducer.add({
      name: 'enrich-book-data',
      queueName: 'book-queue',
      children: childJobs,
    });
  }

  async fetchDescription(books: BookEntity[]): Promise<BookEntity[]> {
    const context = await getNewBrowserContext();
    return Promise.all(
      books.map(async (book) => {
        const page = await context.newPage();

        const description = await getBookDescription(page, book.url);

        console.info({ description });

        book.description = description ?? '';

        return book;
      }),
    );
  }

  async enrichBookData(job: Job<any, any, string>) {
    const childValues = await job.getChildrenValues();

    console.log('Child values:', childValues);

    return null;
  }
}
