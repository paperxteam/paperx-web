export const cleanTextForPdf = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[^\x20-\x7E\n]/g, '') // Keep standard printable ASCII
    .trim();
};

export const cleanMultiLineTextForPdf = (text: string): string => cleanTextForPdf(text);

