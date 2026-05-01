import { useMemo } from 'react';
import type { CSVRow } from '@/types/csv';
import { cn } from '@utils/cn';

interface CSVPreviewProps {
  data: CSVRow[];
  maxRows?: number;
}

export const CSVPreview = ({ data, maxRows = 10 }: CSVPreviewProps) => {
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    const firstRow = data[0];
    if (!firstRow) return [];
    return Object.keys(firstRow);
  }, [data]);

  const displayData = useMemo(() => {
    return data.slice(0, maxRows);
  }, [data, maxRows]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 text-sm text-gray-600">
        Exibindo {Math.min(maxRows, data.length)} de {data.length} linhas
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {displayData.map((row, rowIndex) => (
            <tr key={rowIndex} className={cn(rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 text-sm text-gray-900">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
