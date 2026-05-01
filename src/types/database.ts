export interface Database {
  public: {
    Tables: {
      imported_data: {
        Row: {
          id: string;
          user_id: string;
          data: Record<string, unknown>;
          uploaded_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data: Record<string, unknown>;
          uploaded_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data?: Record<string, unknown>;
          uploaded_at?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
