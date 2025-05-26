import axios from 'axios';
import { BookEntity } from '../../book/book.entity';

export const triggerDocumentUpdateWebhook = (
  url: string,
  books: BookEntity[],
) => {
  console.info('Sending Book Data to webhook...');

  return axios.post(url, {
    rows: books.map((book) => ({
      Title: book.title,
      Author: book.author ?? '',
      Description: book.description,
      Summary: book.summary,
      'Current Price': book.currentPrice,
      'Original Price': book.originalPrice,
      'Discount Amount': book.discountAmount,
      'Discount %': book.discountPercentage,
      'Value Score': book.valueScore,
      'Relevance Score': book.relevanceScore,
      URL: book.url,
    })),
  });
};
