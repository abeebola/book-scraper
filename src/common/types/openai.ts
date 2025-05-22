export type OpenAiResult = {
  id: string;
  requestId: string;
  summary: string;
  relevanceScore: number;
  discountAmount: number;
  discountPercentage: number;
  valueScore: number;
  authors: string;
};
