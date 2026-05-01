import type { ParseConfig } from 'papaparse';

export interface CSVRow {
  [key: string]: string | number | null;
}

export interface CSVColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface PapaParseError {
  type: string;
  code: string;
  message: string;
  row: number;
}

export interface PapaParseMeta {
  delimiter: string;
  linebreak: string;
  aborted: boolean;
  truncated: boolean;
  cursor: number;
}

export interface ParseResult {
  data: CSVRow[];
  errors: PapaParseError[];
  meta: PapaParseMeta;
}

export interface CSVParseConfig extends ParseConfig {
  onComplete?: (result: ParseResult) => void;
  onError?: (errors: PapaParseError[]) => void;
  onChunk?: (data: CSVRow[]) => void;
}
