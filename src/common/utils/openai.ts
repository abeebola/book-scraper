import { OpenAI } from 'openai';
import { ChatCompletionTool } from 'openai/resources/chat';
import { BookEntity } from '../../book/book.entity';
import { OpenAiResult } from '../types/openai';

let openai: OpenAI;

const summaryTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'analyze_books_summary',
      description: 'Analyze and summarize book metadata',
      parameters: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                requestId: { type: 'string' },
                summary: { type: 'string' },
                relevanceScore: { type: 'number', minimum: 0, maximum: 100 },
              },
              required: [
                'id',
                'requestId',
                'summary',
                'relevanceScore',
              ] satisfies (keyof OpenAiResult)[],
            },
          },
        },
        required: ['results'],
      },
    },
  },
];

const authorTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'analyze_book_authors',
      description: 'Return author information from book description',
      parameters: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                authors: {
                  type: 'string',
                  description: 'Comma-separated list of authors, if any',
                },
              },
              required: [
                'id',
                'requestId',
                'authors',
              ] satisfies (keyof OpenAiResult)[],
            },
          },
        },
        required: ['results'],
      },
    },
  },
];

export const getDataFromAi = async (books: BookEntity[], theme: string) => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  const booksMap = new Map(books.map((book) => [book.id, book]));

  const [summaries, authors] = await Promise.all([
    summarizeBooks(theme, books),
    extractAuthorNames(books),
  ]);

  summaries.forEach((summary) => {
    const book = booksMap.get(summary.id);

    if (!book) return;

    book.relevanceScore = summary.relevanceScore;
    book.summary = summary.summary;
  });

  authors.forEach((data) => {
    const book = booksMap.get(data.id);

    if (!book) return;

    book.author = data.authors;
  });

  return Array.from(booksMap.values());
};

const summarizeBooks = async (theme: string, books: BookEntity[]) => {
  const prompt = `Given these books:

  ${JSON.stringify(books, null, 2)}

and this theme: "${theme}", Do two things:
- Summarize the description in 1–2 sentences
- Give a relevance score from 0 to 100 for how well the description matches the theme.
Respond only with a valid JSON object.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    messages: [{ role: 'user', content: prompt }],
    tools: summaryTools,
    response_format: { type: 'json_object' },
    tool_choice: 'auto',
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];

  if (toolCall) {
    const response = JSON.parse(toolCall.function.arguments);

    return response.results;
  } else {
    console.warn(
      'No tool was called. Response:\n',
      response.choices[0].message.content,
    );

    return [];
  }
};

const extractAuthorNames = async (books: BookEntity[]) => {
  const prompt = `Given these books:

  ${JSON.stringify(books, null, 2)}

- Extract the author names from the book description and return as a comma-separated string.
- If no authors found, return an empty string.

Respond only with a valid JSON object.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0125',
    messages: [{ role: 'user', content: prompt }],
    tools: authorTools,
    tool_choice: 'auto',
    response_format: { type: 'json_object' },
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];

  if (toolCall) {
    try {
      const response = JSON.parse(toolCall.function.arguments);

      return response.results;
    } catch (error) {
      console.error({ error, args: toolCall.function.arguments });
    }
  } else {
    console.warn(
      'No tool was called. Response:\n',
      response.choices[0].message.content,
    );

    return [];
  }
};
