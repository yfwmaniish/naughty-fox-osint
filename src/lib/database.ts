import Database from 'better-sqlite3';
import { OSINTCase, UploadedFile, AIAnalysis, OSINTReport } from '@/types';

class OSINTDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database('osint.db');
    this.initializeTables();
  }

  private initializeTables() {
    // Cases table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    // Files table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        url TEXT NOT NULL,
        thumbnail TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tags TEXT,
        annotations TEXT,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);

    // Analysis results table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        entities TEXT,
        relationships TEXT,
        timeline TEXT,
        insights TEXT,
        risk_score REAL DEFAULT 0,
        confidence REAL DEFAULT 0,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);

    // Reports table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        sections TEXT,
        metadata TEXT,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'draft',
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      CREATE INDEX IF NOT EXISTS idx_files_case_id ON files(case_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_case_id ON analysis_results(case_id);
      CREATE INDEX IF NOT EXISTS idx_reports_case_id ON reports(case_id);
    `);
  }

  // Case operations
  saveCase(osintCase: OSINTCase): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cases (id, name, subject, description, status, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      osintCase.id,
      osintCase.name,
      osintCase.subject,
      osintCase.description,
      osintCase.status,
      osintCase.createdAt.toISOString(),
      osintCase.updatedAt.toISOString(),
      JSON.stringify({
        aiAnalysis: osintCase.aiAnalysis,
        report: osintCase.report
      })
    );

    // Save associated files
    this.saveFiles(osintCase.id, osintCase.files);
  }

  getCases(): OSINTCase[] {
    const stmt = this.db.prepare(`
      SELECT * FROM cases ORDER BY updated_at DESC
    `);
    
    const cases = stmt.all() as any[];
    
    return cases.map(row => {
      const metadata = JSON.parse(row.metadata || '{}');
      const files = this.getFilesByCase(row.id);
      
      return {
        id: row.id,
        name: row.name,
        subject: row.subject,
        description: row.description || '',
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        files,
        aiAnalysis: metadata.aiAnalysis || {
          entities: [],
          relationships: [],
          timeline: [],
          insights: [],
          riskScore: 0,
          confidence: 0,
          processedAt: new Date()
        },
        report: metadata.report || {
          id: '',
          caseId: row.id,
          sections: [],
          metadata: {
            title: '',
            investigator: 'AI System',
            caseNumber: row.id,
            dateGenerated: new Date(),
            confidentialityLevel: 'confidential',
            pageCount: 0,
            wordCount: 0
          },
          generatedAt: new Date(),
          lastModified: new Date(),
          status: 'draft'
        }
      } as OSINTCase;
    });
  }

  getCase(id: string): OSINTCase | null {
    const stmt = this.db.prepare('SELECT * FROM cases WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    const metadata = JSON.parse(row.metadata || '{}');
    const files = this.getFilesByCase(row.id);
    
    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      description: row.description || '',
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      files,
      aiAnalysis: metadata.aiAnalysis,
      report: metadata.report
    } as OSINTCase;
  }

  deleteCase(id: string): void {
    const stmt = this.db.prepare('DELETE FROM cases WHERE id = ?');
    stmt.run(id);
  }

  // File operations
  private saveFiles(caseId: string, files: UploadedFile[]): void {
    // Delete existing files for this case
    const deleteStmt = this.db.prepare('DELETE FROM files WHERE case_id = ?');
    deleteStmt.run(caseId);

    // Insert new files
    const insertStmt = this.db.prepare(`
      INSERT INTO files (id, case_id, name, type, size, url, thumbnail, uploaded_at, tags, annotations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    files.forEach(file => {
      insertStmt.run(
        file.id,
        caseId,
        file.name,
        file.type,
        file.size,
        file.url,
        file.thumbnail || null,
        file.uploadedAt.toISOString(),
        JSON.stringify(file.tags),
        JSON.stringify(file.annotations)
      );
    });
  }

  private getFilesByCase(caseId: string): UploadedFile[] {
    const stmt = this.db.prepare('SELECT * FROM files WHERE case_id = ? ORDER BY uploaded_at DESC');
    const files = stmt.all(caseId) as any[];
    
    return files.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      url: row.url,
      thumbnail: row.thumbnail,
      uploadedAt: new Date(row.uploaded_at),
      tags: JSON.parse(row.tags || '[]'),
      annotations: JSON.parse(row.annotations || '[]')
    }));
  }

  // Backup and recovery
  backup(): string {
    const stmt = this.db.prepare('SELECT * FROM sqlite_master WHERE type="table"');
    const tables = stmt.all();
    
    let backup = '';
    tables.forEach((table: any) => {
      const data = this.db.prepare(`SELECT * FROM ${table.name}`).all();
      backup += `-- Table: ${table.name}\n`;
      backup += JSON.stringify(data) + '\n\n';
    });
    
    return backup;
  }

  close(): void {
    this.db.close();
  }
}

export const db = new OSINTDatabase();