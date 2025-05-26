import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import {
  BOOK_BATCH_SIZE,
  BOOK_DATA_SUCCESS_THRESHOLD,
} from '../common/constants';
import { roundToPrecision } from '../common/utils/amounts';
import { getNewBrowserContext } from '../common/utils/browser';
import { triggerDocumentUpdateWebhook } from '../common/utils/integrations';
import { getBatchCount } from '../common/utils/numbers';
import { getDataFromAi } from '../common/utils/openai';
import { getSearchResults } from '../common/utils/scraper';
import { AppConfig } from '../config/app';
import { ScrapeRequestEntity } from '../scrape/scrape-request.entity';
import { getPriceFromString } from './../common/utils/numbers';
import {
  BookQueues,
  FetchBookRequest,
  ProcessBookDataRequest,
} from './book.dto';
import { BookEntity } from './book.entity';

@Injectable()
export class BookService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(BookEntity)
    private readonly repository: Repository<BookEntity>,
    @InjectRepository(ScrapeRequestEntity)
    private readonly requestRepository: Repository<ScrapeRequestEntity>,
    @InjectQueue('book-description-queue' satisfies BookQueues)
    private readonly bookDescriptionQueue: Queue,
    @InjectQueue('data-enrichment-queue' satisfies BookQueues)
    private readonly dataEnrichmentQueue: Queue,
  ) {}

  async fetchBooks(data: FetchBookRequest) {
    const { requestId, theme } = data;

    let books: BookEntity[];

    try {
      const results = await Promise.all(
        [1, 2].map((page) => getSearchResults(theme, page)),
      );

      books = results
        .flat()
        .map((book) => ({ ...book, requestId }) as BookEntity);

      if (!books.length) {
        console.info('No books found.');
        await this.requestRepository.manager.update(
          ScrapeRequestEntity,
          requestId,
          {
            status: 'done',
          },
        );

        return;
      }

      // Keep track of expected result and batch counts.
      await this.requestRepository.manager.update(
        ScrapeRequestEntity,
        requestId,
        {
          expectedResults: books.length,
          // Could be tracked elsewhere like Redis or a mutex
          // Only using a DB column for this test
          expectedBatches: getBatchCount(books.length, BOOK_BATCH_SIZE),
        },
      );
    } catch (error) {
      console.error(error);
      await this.requestRepository.manager.update(
        ScrapeRequestEntity,
        requestId,
        {
          status: 'failed',
        },
      );

      return;
    }

    while (books.length) {
      const batchAmount = Math.min(books.length, BOOK_BATCH_SIZE);
      const batch = books.splice(0, batchAmount);

      // adding books to description queue
      console.info('Adding books to description queue...');
      await this.bookDescriptionQueue.add(
        'fetch-book-description',
        { theme, books: batch } as ProcessBookDataRequest,
        {
          removeOnComplete: true,
        },
      );
    }
  }

  async fetchDescription({ theme, books }: ProcessBookDataRequest) {
    const context = await getNewBrowserContext();

    const result = await Promise.allSettled(
      books.map(async (book) => {
        const page = await context.newPage();

        await page.goto(book.url);

        const locator = page.locator('#tab-description');

        await locator.waitFor({ timeout: 3000 });

        const description = await locator.getByRole('paragraph').textContent();

        book.description = description ?? '';

        return book;
      }),
    );

    void context.close();

    const successful = result
      .filter((x) => x.status === 'fulfilled')
      .map((y) => y.value);

    await this.dataEnrichmentQueue.add('enrich-book-data', {
      theme,
      books: successful,
    } as ProcessBookDataRequest);
  }

  async enrichBookData({ theme, books }: ProcessBookDataRequest) {
    const response = await getDataFromAi(books, theme).catch((error) => {
      console.error('There was an error from OpenAI.', error);
      throw error;
    });

    const responseMap: Map<string, any> = new Map(
      response.map((x) => [x.id, x]),
    );

    try {
      const enhancedBooks = books.map((book) => {
        const entry = responseMap.get(book.id);

        const originalPrice = getPriceFromString(book.originalPrice);
        const currentPrice = getPriceFromString(book.currentPrice);
        const discountAmount = originalPrice - currentPrice;
        book.discountAmount = discountAmount;

        book.discountPercentage = roundToPrecision(
          (discountAmount / originalPrice) * 100,
        );

        book.author = entry.author ?? null;
        book.relevanceScore = roundToPrecision(entry.relevanceScore ?? 0);
        book.summary = entry.summary;
        book.valueScore = roundToPrecision(entry.relevanceScore / currentPrice);

        return book;
      });

      await this.repository.manager.transaction(async (trx) => {
        const request = await trx.findOne(ScrapeRequestEntity, {
          where: { id: books[0].requestId },
          select: {
            id: true,
            expectedBatches: true,
            processedBatches: true,
            expectedResults: true,
          },
        });

        if (!request) return;

        const { expectedBatches, processedBatches, expectedResults } = request;

        await trx.insert(BookEntity, enhancedBooks);

        await trx.increment(
          ScrapeRequestEntity,
          { id: request.id },
          'processedBatches',
          1,
        );

        if (expectedBatches === processedBatches + 1) {
          const count = await trx.countBy(BookEntity, {
            requestId: request.id,
          });
          const currentThreshold = (count / expectedResults) * 100;

          await trx.update(ScrapeRequestEntity, request.id, {
            status:
              currentThreshold >= BOOK_DATA_SUCCESS_THRESHOLD
                ? 'done'
                : 'failed',
          });
        }

        const webhookUrl =
          this.configService.getOrThrow<AppConfig>('app').makeWebhookUrl;

        triggerDocumentUpdateWebhook(webhookUrl, enhancedBooks).catch(
          (error) => {
            console.error(error);
          },
        );
      });
    } catch (error) {
      console.error(error);
    }
  }
}
