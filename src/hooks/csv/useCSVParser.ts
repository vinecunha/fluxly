import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { CSVRow, ParseResult, PapaParseError, PapaParseMeta } from '@/types/csv';
import { DEFAULT_PARSE_CONFIG } from '@lib/papa-parse';
import { validateCSVFile, sanitizeCSVRow } from '@utils/csv/validators';

interface UseCSVParserReturn {
  data: CSVRow[];
  errors: PapaParseError[];
  isParsing: boolean;
  parseFile: (file: File) => Promise<ParseResult>;
  reset: () => void;
}

export const useCSVParser = (): UseCSVParserReturn => {
  const [data, setData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<PapaParseError[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const parseFile = useCallback(async (file: File): Promise<ParseResult> => {
    validateCSVFile(file);
    setIsParsing(true);

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        ...DEFAULT_PARSE_CONFIG,
        complete: (results) => {
          const resultData = results.data as CSVRow[];
          const sanitizedData = resultData.map(sanitizeCSVRow);
          setData(sanitizedData);
          setErrors(results.errors as PapaParseError[]);
          setIsParsing(false);

          const result: ParseResult = {
            data: sanitizedData,
            errors: results.errors as PapaParseError[],
            meta: results.meta as PapaParseMeta,
          };

          resolve(result);
        },
        error: (error) => {
          setIsParsing(false);
          reject(error);
        },
      });
    });
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setErrors([]);
    setIsParsing(false);
  }, []);

  return { data, errors, isParsing, parseFile, reset };
};
