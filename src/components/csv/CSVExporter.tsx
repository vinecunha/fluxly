import { useState } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import type { CSVRow } from '@/types/csv';
import { Button } from '@components/ui/Button';

interface CSVExporterProps {
  data: CSVRow[];
  filename?: string;
  disabled?: boolean;
}

export const CSVExporter = ({ data, filename = 'export.csv', disabled = false }: CSVExporterProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    if (data.length === 0) return;

    setIsExporting(true);

    try {
      const csv = Papa.unparse(data, {
        header: true,
        newline: '\r\n',
      });

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToCSV}
      isLoading={isExporting}
      disabled={disabled || data.length === 0}
    >
      Exportar CSV
    </Button>
  );
};
