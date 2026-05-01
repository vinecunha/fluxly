import type { CSVRow } from '@/types/csv';
import { MAX_FILE_SIZE, ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from '@constants/csv';
import { logger } from '@lib/logger';

export const validateCSVFile = (file: File): boolean => {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Formato de arquivo não suportado. Use .csv ou .txt');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo excede o limite de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== '') {
    logger.warn('Tipo MIME não padrão:', file.type);
  }

  return true;
};

export const sanitizeCSVRow = (row: CSVRow): CSVRow => {
  const sanitized: CSVRow = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.replace(/[\x00-\x1F\x7F]/g, '').trim();
    const cleanValue = typeof value === 'string'
      ? value.replace(/[\x00-\x1F\x7F]/g, '').trim()
      : value;

    sanitized[cleanKey] = cleanValue;
  }

  return sanitized;
};

export const preventCSVInjection = (value: string | number | null): string => {
  if (value === null || value === undefined) return '';

  const str = String(value);

  if (/^[+=@-]/.test(str)) {
    return `'${str}`;
  }

  return str;
};
