import { BrowserContext, Page } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { BookEntity } from '../book.entity';
import { getNewBrowserContext } from './browser';

let context: BrowserContext;

export const getNewPage = async () => {
  if (!context) {
    context = await getNewBrowserContext();
  }

  return context.newPage();
};

export const closeBrowserContext = async () => {
  if (context) {
    try {
      await context.close();
    } catch {
      // do nothing.
    }
  }
};

export const getSearchUrl = (searchTerm: string, page: number) => {
  const BASE_URL = 'https://bookdp.com.au';
  const searchParams = new URLSearchParams();

  searchParams.append('s', searchTerm);
  searchParams.append('post_type', 'product');

  return `${BASE_URL}/page/${page}/?${searchParams.toString()}`;
};

export const getSearchResults = async (searchTerm: string, page: number) => {
  const url = getSearchUrl(searchTerm, page);

  console.info('Opening new page...');

  const browserPage = await getNewPage();

  console.info(`visiting search URL [${url}] ...`);

  const response = await browserPage.goto(url, { timeout: 10_000 });
  const status = response?.status();

  if (status === 404) {
    return [];
  }

  const locator = browserPage.locator('.site-main');

  await locator.waitFor({ timeout: 3000 });

  console.info('finding books...');

  const books = await locator.locator('.product-inner .product-summary').all();

  if (!books.length) {
    browserPage.close().catch(() => {
      // do nothing
    });

    return [];
  }

  const results = await Promise.all(
    books.map(async (locator) => {
      const heading = locator.getByRole('heading');
      const url = await heading.getByRole('link').getAttribute('href');
      const title = await heading.textContent();

      const amountElements = await locator.locator('.amount').all();
      const [originalPrice, currentPrice] = await Promise.all(
        amountElements.map((l) => l.textContent()),
      );

      return Object.assign(new BookEntity(), {
        id: uuidv4(),
        title,
        url,
        originalPrice,
        currentPrice,
      }) as BookEntity;
    }),
  );

  console.info('closing page...');

  browserPage.close().catch(() => {
    // do nothing
  });

  return results;
};

export const getBookDescription = async (page: Page, url: string) => {
  await page.goto(url);

  const locator = page.locator('#tab-description');

  await locator.waitFor({ timeout: 3000 });

  const description = await locator.getByRole('paragraph').textContent();

  return description;
};
