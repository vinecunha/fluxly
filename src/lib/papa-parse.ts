import Papa, { type ParseConfig } from 'papaparse';

export const DEFAULT_PARSE_CONFIG: ParseConfig = {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true,
  transformHeader: (header: string) => {
    return header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  },
  transform: (value: string) => {
    return typeof value === 'string' ? value.trim() : value;
  },
};

export { Papa };
