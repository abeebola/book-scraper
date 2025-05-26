export const getBatchCount = (numElements: number, batchSize: number) => {
  return Math.ceil(numElements / batchSize);
};

// naive implementation
export const getPriceFromString = (str?: string) =>
  parseFloat(str?.replace('$', '') ?? '0');
