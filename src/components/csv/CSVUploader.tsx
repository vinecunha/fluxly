import { useState, useCallback } from 'react';
import type { PapaParseError } from '@/types/csv';
import type { ParseResult } from '@/types/csv';
import { validateCSVFile } from '@utils/csv/validators';
import { useCSVParser } from '@hooks/csv/useCSVParser';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

interface CSVUploaderProps {
  maxFileSize?: number;
  allowedExtensions?: string[];
  onParseComplete: (result: ParseResult) => void;
  onParseError: (errors: PapaParseError[]) => void;
}

export const CSVUploader = ({
  onParseComplete,
  onParseError,
}: CSVUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { parseFile, isParsing } = useCSVParser();

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    try {
      validateCSVFile(file);
      const result = await parseFile(file);
      onParseComplete(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      onParseError([{ type: 'validation', code: 'error', message, row: 0 }]);
    }
  }, [parseFile, onParseComplete, onParseError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          error && 'border-red-300 bg-red-50'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <p className="mt-2 text-sm text-gray-600">
          Arraste um arquivo CSV ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-gray-500">
          .csv ou .txt (máx. 10MB)
        </p>

        <label className="mt-4 inline-block">
          <Button isLoading={isParsing}>
            {isParsing ? 'Processando...' : 'Selecionar Arquivo'}
          </Button>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleInputChange}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
