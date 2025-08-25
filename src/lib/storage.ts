import { OSINTCase, UploadedFile } from '@/types';

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