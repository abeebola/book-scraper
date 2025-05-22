import { BrowserContext, Page } from '@playwright/test';
import { getNewBrowserContext } from './browser';
import { BookEntity } from '../book.entity';

let context: BrowserContext;

export const getNewPage = async () => {
  if (!context) {
    context = await getNewBrowserContext();
  }

  return context.newPage();
};

export const getSearchUrl = (searchTerm: string, page: number) => {
  const BASE_URL = 'https://bookdp.com.au';
  const searchParams = new URLSearchParams();

  searchParams.append('s', searchTerm);
  searchParams.append('post_type', 'product');

  return `${BASE_URL}/page/${page}/?${searchParams.toString()}`;
};

export const getSearchResults = async (url: string) => {
  console.info('Opening new page...');
  const page = await getNewPage();

  console.info(`visiting search URL [${url}] ...`);

  await page.goto(url);

  const locator = page.locator('.products');

  await locator.waitFor({ timeout: 3000 });

  console.info('finding books...');

  const books = await locator.locator('.product-inner .product-summary').all();

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
        title,
        url,
        originalPrice,
        currentPrice,
      });
    }),
  );

  console.info('closing page...');

  page.close().catch(() => {
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
