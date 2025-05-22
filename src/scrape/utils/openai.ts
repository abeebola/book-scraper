import { OpenAI } from 'openai';
import { ChatCompletionTool } from 'openai/resources/chat';
import { OpenAiResult } from '../../common/types/openai';
import { BookEntity } from '../book.entity';

let openai: OpenAI;

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'analyze_books',
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
                discountAmount: { type: 'number' },
                discountPercentage: { type: 'number' },
                valueScore: { type: 'number' },
                authors: {
                  type: 'string',
                  description: 'Comma-separated list of authors, if any',
                },
              },
              required: [
                'id',
                'requestId',
                'summary',
                'relevanceScore',
                'discountAmount',
                'discountPercentage',
                'valueScore',
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

export const run = async (books: BookEntity[]) => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  const userPrompt = `
Given the following books:

${JSON.stringify(books, null, 2)}

For each one:
- Summarize the description in 1-2 sentences.
- Score how relevant it is to the given theme (0–100).
- Calculate the discount amount and discount percentage.
- Return a valueScore = relevanceScore / currentPrice.
- Extract author names from the description, if present.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: userPrompt }],
    tools,
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
