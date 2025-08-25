import { OSINTCase, UploadedFile, TimelineEvent } from '@/types';
import { supabase, checkSupabaseConnection, uploadFileToSupabase } from './supabase';

// Simple encryption for demo purposes (in production, use proper encryption)
const STORAGE_KEY = 'osint_cases';
const ENCRYPTION_KEY = 'osint_secure_key_2024';

const simpleEncrypt = (text: string): string => {
  return btoa(text); // Base64 encoding for demo
};

const simpleDecrypt = (encrypted: string): string => {
  try {
    return atob(encrypted); // Base64 decoding for demo
  } catch {
    return encrypted;
  }
};

// Check if Supabase is available and configured
let useSupabase = false;

// Initialize Supabase connection check
if (supabase) {
  checkSupabaseConnection().then(isConnected => {
    useSupabase = isConnected;
    console.log(`Storage mode: ${useSupabase ? 'Supabase' : 'Local Storage'}`);
  }).catch(() => {
    useSupabase = false;
    console.log('Storage mode: Local Storage (Supabase unavailable)');
  });
} else {
  console.log('Storage mode: Local Storage (Supabase not configured)');
}

export const saveCase = (osintCase: OSINTCase): void => {
  try {
    const cases = getCases();
    const existingIndex = cases.findIndex(c => c.id === osintCase.id);
    
    if (existingIndex >= 0) {
      cases[existingIndex] = osintCase;
    } else {
      cases.push(osintCase);
    }
    
    const encrypted = simpleEncrypt(JSON.stringify(cases));
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save case:', error);
  }
};

export const getCases = (): OSINTCase[] => {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return [];
    
    const decrypted = simpleDecrypt(encrypted);
    const cases = JSON.parse(decrypted);
    
    // Convert date strings back to Date objects
    return cases.map((c: OSINTCase) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      files: c.files.map((f: UploadedFile) => ({
        ...f,
        uploadedAt: new Date(f.uploadedAt)
      })),
      aiAnalysis: {
        ...c.aiAnalysis,
        processedAt: new Date(c.aiAnalysis.processedAt),
        timeline: c.aiAnalysis.timeline.map((t: TimelineEvent) => ({
          ...t,
          date: new Date(t.date)
        }))
      },
      report: {
        ...c.report,
        generatedAt: new Date(c.report.generatedAt),
        lastModified: new Date(c.report.lastModified),
        metadata: {
          ...c.report.metadata,
          dateGenerated: new Date(c.report.metadata.dateGenerated)
        }
      }
    }));
  } catch (error) {
    console.error('Failed to load cases:', error);
    return [];
  }
};

export const getCase = (id: string): OSINTCase | null => {
  const cases = getCases();
  return cases.find(c => c.id === id) || null;
};

export const deleteCase = (id: string): void => {
  try {
    const cases = getCases().filter(c => c.id !== id);
    const encrypted = simpleEncrypt(JSON.stringify(cases));
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to delete case:', error);
  }
};

// File storage utilities
export const saveFileToStorage = async (file: File): Promise<UploadedFile> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: reader.result as string,
        uploadedAt: new Date(),
        tags: [],
        annotations: []
      };
      
      // Generate thumbnail for images
      if (file.type.startsWith('image/')) {
        uploadedFile.thumbnail = reader.result as string;
      }
      
      resolve(uploadedFile);
    };
    reader.readAsDataURL(file);
  });
};

export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Supabase-specific functions
export const saveCaseToSupabase = async (osintCase: OSINTCase): Promise<void> => {
  if (!useSupabase) {
    throw new Error('Supabase is not available');
  }

  try {
    // Save main case data
    const { error: caseError } = await supabase
      .from('osint_cases')
      .upsert({
        id: osintCase.id,
        name: osintCase.name,
        subject: osintCase.subject,
        description: osintCase.description,
        status: osintCase.status,
        created_at: osintCase.createdAt.toISOString(),
        updated_at: osintCase.updatedAt.toISOString(),
        metadata: {
          aiAnalysis: osintCase.aiAnalysis,
          report: osintCase.report
        }
      });

    if (caseError) throw caseError;

    // Save files
    for (const file of osintCase.files) {
      const { error: fileError } = await supabase
        .from('case_files')
        .upsert({
          id: file.id,
          case_id: osintCase.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
          thumbnail: file.thumbnail,
          uploaded_at: file.uploadedAt.toISOString(),
          tags: file.tags,
          annotations: file.annotations
        });

      if (fileError) throw fileError;
    }
  } catch (error) {
    console.error('Failed to save case to Supabase:', error);
    throw error;
  }
};

export const getCasesFromSupabase = async (): Promise<OSINTCase[]> => {
  if (!useSupabase) {
    throw new Error('Supabase is not available');
  }

  try {
    const { data: cases, error } = await supabase
      .from('osint_cases')
      .select(`
        *,
        case_files (*)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return cases.map((caseData: any) => {
      const metadata = caseData.metadata || {};
      return {
        id: caseData.id,
        name: caseData.name,
        subject: caseData.subject,
        description: caseData.description || '',
        status: caseData.status,
        createdAt: new Date(caseData.created_at),
        updatedAt: new Date(caseData.updated_at),
        files: (caseData.case_files || []).map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url,
          thumbnail: file.thumbnail,
          uploadedAt: new Date(file.uploaded_at),
          tags: file.tags || [],
          annotations: file.annotations || []
        })),
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
          caseId: caseData.id,
          sections: [],
          metadata: {
            title: '',
            investigator: 'AI System',
            caseNumber: caseData.id,
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
  } catch (error) {
    console.error('Failed to load cases from Supabase:', error);
    throw error;
  }
};

export const deleteCaseFromSupabase = async (caseId: string): Promise<void> => {
  if (!useSupabase) {
    throw new Error('Supabase is not available');
  }

  try {
    const { error } = await supabase
      .from('osint_cases')
      .delete()
      .eq('id', caseId);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete case from Supabase:', error);
    throw error;
  }
};

// Enhanced file upload with Supabase support
export const saveFileWithSupabase = async (file: File): Promise<UploadedFile> => {
  try {
    if (useSupabase) {
      // Upload to Supabase Storage
      const { publicUrl, fileName } = await uploadFileToSupabase(file);
      
      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: publicUrl,
        thumbnail: file.type.startsWith('image/') ? publicUrl : undefined,
        uploadedAt: new Date(),
        tags: [],
        annotations: []
      };
    } else {
      // Fallback to local storage
      return await saveFileToStorage(file);
    }
  } catch (error) {
    console.error('Failed to upload file, falling back to local storage:', error);
    return await saveFileToStorage(file);
  }
};

// Hybrid save function that tries Supabase first, falls back to localStorage
export const saveCaseHybrid = async (osintCase: OSINTCase): Promise<void> => {
  try {
    if (useSupabase) {
      await saveCaseToSupabase(osintCase);
    } else {
      saveCase(osintCase); // Local storage fallback
    }
  } catch (error) {
    console.error('Supabase save failed, using local storage:', error);
    saveCase(osintCase); // Always fallback to local storage
  }
};

// Hybrid get function
export const getCasesHybrid = async (): Promise<OSINTCase[]> => {
  try {
    if (useSupabase) {
      return await getCasesFromSupabase();
    } else {
      return getCases(); // Local storage
    }
  } catch (error) {
    console.error('Supabase fetch failed, using local storage:', error);
    return getCases(); // Always fallback to local storage
  }
};
