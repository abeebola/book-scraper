export const roundToPrecision = (value: number | string, precisiom = 2) => {
  return Number(parseFloat(value.toString()).toFixed(precisiom));
};
