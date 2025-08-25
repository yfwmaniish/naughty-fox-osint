import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client only if credentials are provided and valid
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.length > 0) 
  ? createClient(supabaseUrl!, supabaseAnonKey)
  : null;

// Database Types for TypeScript
export interface Database {
  public: {
    Tables: {
      osint_cases: {
        Row: {
          id: string;
          name: string;
          subject: string;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          name: string;
          subject: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
      };
      case_files: {
        Row: {
          id: string;
          case_id: string;
          name: string;
          type: string;
          size: number;
          url: string;
          thumbnail: string | null;
          uploaded_at: string;
          tags: any;
          annotations: any;
        };
        Insert: {
          id?: string;
          case_id: string;
          name: string;
          type: string;
          size: number;
          url: string;
          thumbnail?: string | null;
          uploaded_at?: string;
          tags?: any;
          annotations?: any;
        };
        Update: {
          id?: string;
          case_id?: string;
          name?: string;
          type?: string;
          size?: number;
          url?: string;
          thumbnail?: string | null;
          uploaded_at?: string;
          tags?: any;
          annotations?: any;
        };
      };
      analysis_results: {
        Row: {
          id: string;
          case_id: string;
          entities: any;
          relationships: any;
          timeline: any;
          insights: any;
          risk_score: number;
          confidence: number;
          processed_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          entities: any;
          relationships: any;
          timeline: any;
          insights: any;
          risk_score?: number;
          confidence?: number;
          processed_at?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          entities?: any;
          relationships?: any;
          timeline?: any;
          insights?: any;
          risk_score?: number;
          confidence?: number;
          processed_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          case_id: string;
          sections: any;
          metadata: any;
          generated_at: string;
          last_modified: string;
          status: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          sections: any;
          metadata: any;
          generated_at?: string;
          last_modified?: string;
          status?: string;
        };
        Update: {
          id?: string;
          case_id?: string;
          sections?: any;
          metadata?: any;
          generated_at?: string;
          last_modified?: string;
          status?: string;
        };
      };
    };
  };
}

// Helper functions for database operations
export const checkSupabaseConnection = async () => {
  if (!supabase) {
    return false;
  }
  try {
    const { data, error } = await supabase.from('osint_cases').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
};

// File upload to Supabase Storage
export const uploadFileToSupabase = async (file: File, bucket: string = 'case-files') => {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
    
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
    
  return {
    fileName,
    publicUrl,
    path: data.path
  };
};
