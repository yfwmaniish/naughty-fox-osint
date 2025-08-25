-- OSINT Report Generator Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable Row Level Security (RLS)
-- This is optional for demonstration purposes, but recommended for production

-- Create the main cases table
CREATE TABLE IF NOT EXISTS public.osint_cases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Create the files table
CREATE TABLE IF NOT EXISTS public.case_files (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.osint_cases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    tags JSONB DEFAULT '[]'::jsonb,
    annotations JSONB DEFAULT '[]'::jsonb
);

-- Create the analysis results table
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.osint_cases(id) ON DELETE CASCADE,
    entities JSONB DEFAULT '[]'::jsonb,
    relationships JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    insights JSONB DEFAULT '[]'::jsonb,
    risk_score REAL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 1),
    confidence REAL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL REFERENCES public.osint_cases(id) ON DELETE CASCADE,
    sections JSONB DEFAULT '[]'::jsonb,
    metadata JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'published'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.osint_cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.osint_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON public.osint_cases(updated_at);
CREATE INDEX IF NOT EXISTS idx_files_case_id ON public.case_files(case_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON public.case_files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_analysis_case_id ON public.analysis_results(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_case_id ON public.reports(case_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_osint_cases_updated_at 
    BEFORE UPDATE ON public.osint_cases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON public.reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for case files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('case-files', 'case-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (optional - remove if you want open access)
-- ALTER TABLE public.osint_cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment and modify as needed)
-- CREATE POLICY "Allow all operations for authenticated users" ON public.osint_cases
--     FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow all operations for authenticated users" ON public.case_files
--     FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow all operations for authenticated users" ON public.analysis_results
--     FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow all operations for authenticated users" ON public.reports
--     FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON public.osint_cases TO authenticated;
GRANT ALL ON public.case_files TO authenticated;
GRANT ALL ON public.analysis_results TO authenticated;
GRANT ALL ON public.reports TO authenticated;

-- Grant permissions to anonymous users (for demo purposes)
GRANT ALL ON public.osint_cases TO anon;
GRANT ALL ON public.case_files TO anon;
GRANT ALL ON public.analysis_results TO anon;
GRANT ALL ON public.reports TO anon;

-- Set up storage permissions
INSERT INTO storage.objects_permissions (bucket_id, permissions)
VALUES ('case-files', ARRAY['select', 'insert', 'update', 'delete'])
ON CONFLICT DO NOTHING;
