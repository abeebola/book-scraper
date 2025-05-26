import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BookService } from './book.service';
import { BookQueues, ProcessBookDataRequest } from './book.dto';

@Processor('book-queue' satisfies BookQueues)
export class BookConsumer extends WorkerHost {
  constructor(private readonly bookService: BookService) {
    super();
  }

  async process(job: Job<any, any, string>) {
    console.info(`Running ${job.name} job`);

    return await this.bookService.fetchBooks(job.data);
  }
}

@Processor('book-description-queue' satisfies BookQueues)
export class BookDescriptionConsumer extends WorkerHost {
  constructor(private readonly bookService: BookService) {
    super();
  }

  async process(job: Job<ProcessBookDataRequest>) {
    console.info(`Running ${job.name} job`);

    return await this.bookService.fetchDescription(job.data);
  }
}

@Processor('data-enrichment-queue' satisfies BookQueues)
export class DataEnrichmentConsumer extends WorkerHost {
  constructor(private readonly bookService: BookService) {
    super();
  }

  async process(job: Job<ProcessBookDataRequest>) {
    console.info(`Running ${job.name} job`);

    return await this.bookService.enrichBookData(job.data);
  }
}
