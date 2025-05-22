import { InjectFlowProducer, Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { FlowChildJob, FlowProducer, Job } from 'bullmq';
import { Repository } from 'typeorm';
import { roundToPrecision } from '../common/utils/amounts';
import { BookEntity } from './book.entity';
import { EnrichDataJob } from './scrape.dto';
import { getNewBrowserContext } from './utils/browser';
import { run } from './utils/openai';
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
        return await this.enrichBookData(job);
    }
  }

  async fetchBooks(data: EnrichDataJob) {
    const { requestId, theme } = data;
    const urls = [1].map((page) => getSearchUrl(theme, page));
    // TODO: Uncomment before final push
    // const urls = [1, 2].map((page) => getSearchUrl(theme, page));

    const result = await Promise.all(urls.map((url) => getSearchResults(url)));

    const books = result.flat().map((book) => ({ ...book, requestId }));

    const sample = books.slice(0, 2);

    /*
    Looks like a good balance between the number of tabs to open
    for each background job worker and the amount of books to
    process at once using OpenAI. This can be tweaked as needed
    depending on whether we want to optimise for CPU/memory or
    for cost (per OpenAI prompt).
    Could be set using an environment variable instead.
    */
    const BATCH_SIZE = 6;

    const childJobs: FlowChildJob[] = [];

    while (sample.length) {
      const batchAmount = Math.min(sample.length, BATCH_SIZE);
      const batch = sample.splice(0, batchAmount);
      childJobs.push({
        name: 'fetch-description',
        queueName: 'book-queue',
        data: batch,
      });
    }

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

        book.description = description ?? '';

        page.close().catch(() => {});

        return book;
      }),
    );
  }

  async enrichBookData(job: Job<any, any, string>) {
    const childValues = await job.getChildrenValues();

    const bookResults: BookEntity[][] = Object.values(childValues);

    const updatedBooksPromises = bookResults.map(async (books) => {
      const response = await run(books);

      const responseMap: Map<string, any> = new Map(
        response.map((x) => [x.id, x]),
      );

      return books.map((book) => {
        const entry = responseMap.get(book.id);

        book.author = entry.authors || null;
        book.discountAmount = roundToPrecision(entry.discountAmount);
        book.discountPercentage = roundToPrecision(entry.discountPercentage);
        book.relevanceScore = roundToPrecision(entry.relevanceScore);
        book.summary = entry.summary;
        book.valueScore = roundToPrecision(entry.valueScore);

        return book;
      });
    });

    const allBooks = await Promise.all(updatedBooksPromises).then((x) =>
      x.flat(),
    );

    console.info(allBooks);
  }
}
