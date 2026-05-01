import { supabase } from '@lib/supabase';
import type { CSVRow } from '@/types/csv';
import { BATCH_SIZE } from '@constants/csv';
import { logger } from '@lib/logger';

export const uploadCSVData = async (data: CSVRow[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  const dataWithUserId = data.map(row => ({
    ...row,
    user_id: user.id,
    uploaded_at: new Date().toISOString(),
  }));

  for (let i = 0; i < dataWithUserId.length; i += BATCH_SIZE) {
    const batch = dataWithUserId.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('imported_data')
      .insert(batch);

    if (error) {
      logger.error(`Erro no batch ${i / BATCH_SIZE}:`, error);
      throw error;
    }
  }
};

export const fetchCSVData = async (userId: string, pageSize = 50, page = 0) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  return supabase
    .from('imported_data')
    .select('id, data, uploaded_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })
    .range(from, to);
};
