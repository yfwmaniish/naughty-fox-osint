export interface OSINTCase {
  id: string;
  name: string;
  subject: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'analyzing' | 'completed';
  files: UploadedFile[];
  aiAnalysis: AIAnalysis;
  report: OSINTReport;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
  tags: string[];
  annotations: string[];
}

export interface AIAnalysis {
  entities: Entity[];
  relationships: Relationship[];
  timeline: TimelineEvent[];
  insights: Insight[];
  riskScore: number;
  confidence: number;
  processedAt: Date;
}

export interface Entity {
  id: string;
  type: 'person' | 'location' | 'organization' | 'phone' | 'email' | 'username' | 'ip' | 'url';
  value: string;
  confidence: number;
  sources: string[];
  mentions: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  evidence: string[];
}

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  source: string;
  type: 'social' | 'document' | 'location' | 'communication' | 'transaction';
  entities: string[];
}

export interface Insight {
  id: string;
  type: 'pattern' | 'anomaly' | 'connection' | 'risk' | 'verification';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
  recommendations: string[];
}

export interface OSINTReport {
  id: string;
  caseId: string;
  sections: ReportSection[];
  metadata: ReportMetadata;
  generatedAt: Date;
  lastModified: Date;
  status: 'draft' | 'review' | 'final';
}

export interface ReportSection {
  id: string;
  type: 'executive_summary' | 'subject_profile' | 'key_findings' | 'source_list' | 'evidence' | 'timeline' | 'ai_insights' | 'appendix';
  title: string;
  content: string;
  order: number;
  editable: boolean;
}

export interface ReportMetadata {
  title: string;
  investigator: string;
  caseNumber: string;
  dateGenerated: Date;
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  pageCount: number;
  wordCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'investigator' | 'analyst' | 'admin';
  organization: string;
  licenseNumber?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'html' | 'docx';
  includeEvidence: boolean;
  includeTimeline: boolean;
  watermark: boolean;
  confidentialityLevel: string;
  customBranding?: {
    logo: string;
    organizationName: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
}