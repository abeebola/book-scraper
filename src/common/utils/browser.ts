import { chromium } from '@playwright/test';

export const getNewBrowserContext = () => {
  return chromium.launch().then((browser) => browser.newContext());
};
