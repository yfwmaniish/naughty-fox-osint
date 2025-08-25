import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Plus,
  Globe,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// Import components
import MatrixBackground from '@/components/MatrixBackground';
import CaseManager from '@/components/CaseManager';
import MindMap from '@/components/MindMap';
import FileUpload from '@/components/FileUpload';

// Import types and utilities
import { OSINTCase, UploadedFile, AIAnalysis, OSINTReport } from '@/types';
import { saveCase, getCases } from '@/lib/storage';
import { analyzeWithGemini, isGeminiConfigured } from '@/lib/gemini';
import '../styles/macos-theme.css';

export default function OSINTReportGenerator() {
  const [currentCase, setCurrentCase] = useState<OSINTCase | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [report, setReport] = useState<OSINTReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState('case-setup');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Auto-save timeout ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-save function with debouncing
  const autoSaveCase = useCallback(async () => {
    if (!currentCase) return;
    
    setIsSaving(true);
    
    const updatedCase: OSINTCase = {
      ...currentCase,
      description: investigationNotes,
      files,
      aiAnalysis: aiAnalysis || currentCase.aiAnalysis,
      report: report || currentCase.report,
      updatedAt: new Date()
    };
    
    try {
      saveCase(updatedCase);
      setCurrentCase(updatedCase);
      setLastSaved(new Date());
      
      // Store in localStorage as backup
      localStorage.setItem('currentCase', JSON.stringify(updatedCase));
      localStorage.setItem('investigationNotes', investigationNotes);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentCase, investigationNotes, files, aiAnalysis, report]);

  // Debounced auto-save
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveCase();
    }, 1000); // Save after 1 second of inactivity
  }, [autoSaveCase]);

  useEffect(() => {
    // Apply macOS theme to body
    document.body.classList.add('macos-theme');
    document.documentElement.classList.add('macos-theme');
    
    // Load from localStorage on mount
    const savedCase = localStorage.getItem('currentCase');
    const savedNotes = localStorage.getItem('investigationNotes');
    
    if (savedCase && !currentCase) {
      try {
        const parsedCase = JSON.parse(savedCase);
        // Convert date strings back to Date objects
        parsedCase.createdAt = new Date(parsedCase.createdAt);
        parsedCase.updatedAt = new Date(parsedCase.updatedAt);
        parsedCase.aiAnalysis.processedAt = new Date(parsedCase.aiAnalysis.processedAt);
        
        setCurrentCase(parsedCase);
        setFiles(parsedCase.files || []);
        setAiAnalysis(parsedCase.aiAnalysis && parsedCase.aiAnalysis.entities.length > 0 ? parsedCase.aiAnalysis : null);
        setReport(parsedCase.report && parsedCase.report.sections.length > 0 ? parsedCase.report : null);
      } catch (error) {
        console.error('Failed to load saved case:', error);
      }
    }
    
    if (savedNotes && !investigationNotes) {
      setInvestigationNotes(savedNotes);
    }
    
    return () => {
      document.body.classList.remove('macos-theme');
      document.documentElement.classList.remove('macos-theme');
      
      // Clear timeout on cleanup
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (currentCase && (investigationNotes || files.length > 0)) {
      debouncedAutoSave();
    }
  }, [investigationNotes, files, currentCase?.name, currentCase?.subject, debouncedAutoSave]);

  // Initialize new case
  const createNewCase = () => {
    const newCase: OSINTCase = {
      id: `case_${Date.now()}`,
      name: '',
      subject: '',
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
      files: [],
      aiAnalysis: {
        entities: [],
        relationships: [],
        timeline: [],
        insights: [],
        riskScore: 0,
        confidence: 0,
        processedAt: new Date()
      },
      report: {
        id: '',
        caseId: '',
        sections: [],
        metadata: {
          title: '',
          investigator: 'AI System',
          caseNumber: '',
          dateGenerated: new Date(),
          confidentialityLevel: 'confidential',
          pageCount: 0,
          wordCount: 0
        },
        generatedAt: new Date(),
        lastModified: new Date(),
        status: 'draft'
      }
    };
    
    setCurrentCase(newCase);
    setInvestigationNotes('');
    setFiles([]);
    setAiAnalysis(null);
    setReport(null);
    setActiveTab('case-setup');
    toast.success('New case created successfully!');
  };

    // Load existing case
  const loadCase = (caseData: OSINTCase) => {
    setCurrentCase(caseData);
    setInvestigationNotes(caseData.description || ''); // Use the description field to populate investigation notes
    setFiles(caseData.files || []);
    setAiAnalysis(caseData.aiAnalysis && caseData.aiAnalysis.entities.length > 0 ? caseData.aiAnalysis : null);
    setReport(caseData.report && caseData.report.sections.length > 0 ? caseData.report : null);
    setActiveTab('case-setup');
    toast.success(`Loaded case: ${caseData.name}`);
  };

  // Manual save function (for explicit save button)
  const saveCurrentCase = () => {
    if (!currentCase) return;
    
    autoSaveCase().then(() => {
      toast.success('Case saved successfully');
    }).catch((error) => {
      console.error('Failed to save case:', error);
      toast.error('Failed to save case');
    });
  };

  // Update case basic info with auto-save
  const updateCaseInfo = (field: string, value: string) => {
    if (!currentCase) return;
    
    const updatedCase = {
      ...currentCase,
      [field]: value,
      updatedAt: new Date()
    };
    
    setCurrentCase(updatedCase);
    
    // Trigger auto-save after a brief delay
    debouncedAutoSave();
  };

  // Generate report function
  const generateReport = async () => {
    console.log('🦊 Starting Report Generation...');
    
    if (!currentCase || !aiAnalysis) {
      toast.error('Please complete AI analysis before generating a report');
      return;
    }
    
    setIsGeneratingReport(true);
    setActiveTab('report');
    
    try {
      toast.info('📄 Generating professional OSINT report...');
      
      // Create report sections based on AI analysis
      const reportSections = [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          content: `This OSINT investigation of ${currentCase.subject} has identified ${aiAnalysis.entities.length} entities and ${aiAnalysis.insights.length} key insights. The overall risk assessment score is ${Math.round(aiAnalysis.riskScore * 100)}/100 with a confidence level of ${Math.round(aiAnalysis.confidence * 100)}%.`,
          order: 1
        },
        {
          id: 'case-overview',
          title: 'Case Overview',
          content: `**Case Name:** ${currentCase.name}\n**Subject:** ${currentCase.subject}\n**Description:** ${currentCase.description}\n**Investigation Date:** ${new Date().toLocaleDateString()}\n**Status:** ${currentCase.status}`,
          order: 2
        },
        {
          id: 'entities-identified',
          title: 'Entities Identified',
          content: aiAnalysis.entities.map(entity => 
            `**${entity.type.toUpperCase()}:** ${entity.value} (Confidence: ${Math.round(entity.confidence * 100)}%, Mentions: ${entity.mentions})`
          ).join('\n\n'),
          order: 3
        },
        {
          id: 'key-insights',
          title: 'Key Insights & Analysis',
          content: aiAnalysis.insights.map(insight => 
            `**${insight.title}** (${insight.impact.toUpperCase()} Impact)\n${insight.description}\nConfidence: ${Math.round(insight.confidence * 100)}%`
          ).join('\n\n'),
          order: 4
        },
        {
          id: 'timeline',
          title: 'Timeline of Events',
          content: aiAnalysis.timeline.length > 0 ? 
            aiAnalysis.timeline.map(event => 
              `**${new Date(event.date).toLocaleDateString()}:** ${event.title}\n${event.description}\nSource: ${event.source}`
            ).join('\n\n') : 'No timeline events identified in this investigation.',
          order: 5
        },
        {
          id: 'risk-assessment',
          title: 'Risk Assessment',
          content: `**Overall Risk Score:** ${Math.round(aiAnalysis.riskScore * 100)}/100\n**Confidence Level:** ${Math.round(aiAnalysis.confidence * 100)}%\n\n**Risk Factors:**\n${aiAnalysis.insights.filter(i => i.impact === 'high' || i.impact === 'critical').map(i => `• ${i.title}`).join('\n')}`,
          order: 6
        },
        {
          id: 'recommendations',
          title: 'Recommendations',
          content: aiAnalysis.insights.flatMap(insight => insight.recommendations || []).length > 0 ?
            aiAnalysis.insights.flatMap(insight => insight.recommendations || []).map(rec => `• ${rec}`).join('\n') :
            '• Continue monitoring identified entities\n• Review and validate findings through additional sources\n• Consider escalation based on risk assessment',
          order: 7
        }
      ];
      
      const generatedReport: OSINTReport = {
        id: `report_${Date.now()}`,
        caseId: currentCase.id,
        sections: reportSections,
        metadata: {
          title: `OSINT Investigation Report - ${currentCase.name}`,
          investigator: 'NaughtyFoxy AI System',
          caseNumber: currentCase.id,
          dateGenerated: new Date(),
          confidentialityLevel: 'confidential',
          pageCount: Math.ceil(reportSections.length * 1.5),
          wordCount: reportSections.reduce((total, section) => total + section.content.split(' ').length, 0)
        },
        generatedAt: new Date(),
        lastModified: new Date(),
        status: 'completed'
      };
      
      setReport(generatedReport);
      
      setCurrentCase({
        ...currentCase,
        report: generatedReport,
        status: 'completed',
        updatedAt: new Date()
      });
      
      console.log('✅ Report generated successfully');
      toast.success('🎉 Professional OSINT report generated successfully!');
      
    } catch (error) {
      console.error('❌ Report generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`❌ Report generation failed: ${errorMessage}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Real AI analysis function using Gemini
  const runAIAnalysis = async () => {
    console.log('🦊 Starting AI Analysis...');
    
    if (!currentCase) {
      console.log('❌ No current case');
      return;
    }
    
    console.log('📝 Investigation notes:', investigationNotes.trim());
    console.log('📁 Files count:', files.length);
    
    if (!investigationNotes.trim() && files.length === 0) {
      toast.error('Please add investigation notes or upload files before running analysis');
      return;
    }

    console.log('🔑 Checking Gemini configuration...');
    if (!isGeminiConfigured()) {
      console.log('❌ Gemini not configured');
      toast.error('AI analysis is not configured. Please check your Gemini API key.');
      return;
    }
    
    console.log('✅ Gemini is configured');
    setIsAnalyzing(true);
    setActiveTab('analysis');
    
    try {
      toast.info('🧠 Analyzing with AI... This may take a moment.');
      
      console.log('🚀 Calling Gemini API...');
      
      // Use real Gemini AI analysis
      const analysisResults = await analyzeWithGemini({
        investigationNotes: investigationNotes.trim(),
        caseName: currentCase.name || 'Unnamed Case',
        subject: currentCase.subject || 'Unknown Subject',
        description: currentCase.description || 'No description'
      });
      
      console.log('📊 Analysis results:', analysisResults);
      
      setAiAnalysis(analysisResults);
      
      setCurrentCase({
        ...currentCase,
        status: 'analyzed',
        aiAnalysis: analysisResults,
        updatedAt: new Date()
      });
      
      const entitiesCount = analysisResults.entities.length;
      const insightsCount = analysisResults.insights.length;
      
      console.log(`✅ Analysis completed: ${entitiesCount} entities, ${insightsCount} insights`);
      toast.success(`🎉 AI analysis completed! Found ${entitiesCount} entities and ${insightsCount} insights.`);
      
    } catch (error) {
      console.error('❌ Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`❌ Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PDF Export function with beautiful formatting
  const exportReportAsPDF = async () => {
    if (!report || !currentCase) {
      toast.error('Please generate a report first');
      return;
    }

    setIsExportingPDF(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let currentY = 20;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      
      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }
      };
      
      // Helper function to wrap text
      const wrapText = (text: string, maxWidth: number, fontSize: number) => {
        doc.setFontSize(fontSize);
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const textWidth = doc.getTextWidth(testLine);
          
          if (textWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }
        
        return lines;
      };
      
      // Header with logo area
      doc.setFillColor(59, 130, 246); // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Fox emoji and title
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.text('🦊 NaughtyFoxy OSINT Report', margin, 25);
      
      currentY = 60;
      
      // Report metadata section
      doc.setFillColor(249, 250, 251); // Light gray background
      doc.rect(margin, currentY - 10, contentWidth, 50, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55); // Dark gray
      doc.text('Report Information', margin + 5, currentY);
      
      currentY += 15;
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99); // Medium gray
      
      const metadata = [
        `Case Name: ${currentCase.name}`,
        `Subject: ${currentCase.subject}`,
        `Investigator: ${report.metadata.investigator}`,
        `Generated: ${report.metadata.dateGenerated.toLocaleDateString()}`,
        `Case ID: ${report.metadata.caseNumber}`,
        `Confidentiality: ${report.metadata.confidentialityLevel.toUpperCase()}`
      ];
      
      metadata.forEach(item => {
        doc.text(item, margin + 5, currentY);
        currentY += 5;
      });
      
      currentY += 15;
      
      // Report sections
      report.sections.forEach((section, index) => {
        checkPageBreak(30);
        
        // Section header
        doc.setFillColor(239, 246, 255); // Light blue background
        doc.rect(margin, currentY - 5, contentWidth, 15, 'F');
        
        doc.setFontSize(14);
        doc.setTextColor(29, 78, 216); // Blue text
        doc.text(`${index + 1}. ${section.title}`, margin + 5, currentY + 5);
        
        currentY += 20;
        
        // Section content
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55); // Dark gray
        
        const contentLines = wrapText(section.content, contentWidth - 10, 10);
        
        contentLines.forEach(line => {
          checkPageBreak(6);
          doc.text(line, margin + 5, currentY);
          currentY += 5;
        });
        
        currentY += 10;
      });
      
      // Footer on each page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // Gray
        doc.text(
          `Page ${i} of ${pageCount} | Generated by NaughtyFoxy AI | ${new Date().toLocaleDateString()}`,
          margin,
          pageHeight - 10
        );
        
        // Confidentiality watermark
        doc.setFontSize(6);
        doc.setTextColor(239, 68, 68); // Red
        doc.text(
          `CONFIDENTIAL - ${report.metadata.confidentialityLevel.toUpperCase()}`,
          pageWidth - margin - 40,
          pageHeight - 10
        );
      }
      
      // Save the PDF
      const fileName = `${currentCase.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_osint_report.pdf`;
      doc.save(fileName);
      
      toast.success('🎉 Beautiful PDF report exported successfully!');
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* macOS Window Header - Full Width */}
      <div className="macos-window mx-0 mt-0 mb-6 rounded-none">
        <div className="macos-window-header">
          <div className="macos-traffic-lights">
            <div className="macos-traffic-light close"></div>
            <div className="macos-traffic-light minimize"></div>
            <div className="macos-traffic-light maximize"></div>
          </div>
          <span className="text-white font-semibold text-sm ml-4">
            NaughtyFoxy v2.0.1
          </span>
          <div className="ml-auto flex items-center space-x-2">
            {currentCase && (
              <div className={`macos-status ${
                currentCase.status === 'analyzing' ? 'analyzing' :
                currentCase.status === 'completed' ? '' : 'error'
              }`}>
                <div className="macos-status-dot"></div>
                <span>{currentCase.status.toUpperCase()}</span>
              </div>
            )}
            
            {/* Auto-save status indicator */}
            {currentCase && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                {isSaving ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Auto-saved {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : null}
              </div>
            )}
            
            <button 
              onClick={saveCurrentCase}
              disabled={!currentCase || isSaving}
              className="macos-button macos-button-success"
              title="Manual save (auto-save is enabled)"
            >
              <CheckCircle className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="text-6xl">🦊</div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                NaughtyFoxy
              </h1>
              <p className="text-gray-300">
                AI-Powered OSINT Intelligence Platform - Sly as a Fox! 🦊
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Case Management */}
          <div className="lg:col-span-1">
            <div className="macos-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Case Database</h2>
                <button 
                  onClick={createNewCase}
                  className="macos-button"
                >
                  <Plus className="h-4 w-4" />
                  New
                </button>
              </div>
              <CaseManager
                onCaseSelect={loadCase}
                onNewCase={createNewCase}
                selectedCaseId={currentCase?.id}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!currentCase ? (
              <div className="macos-card animate-fade-in">
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <Brain className="h-20 w-20 text-blue-500 mb-6" />
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    Welcome to NaughtyFoxy 🦊
                  </h2>
                  <p className="text-gray-400 mb-8 max-w-md">
                    Ready to be sly like a fox? Create a new case or select an existing one to start your OSINT investigation with AI-powered analysis.
                  </p>
                  <button 
                    onClick={createNewCase} 
                    className="macos-button text-lg px-8 py-3"
                  >
                    <Plus className="h-5 w-5" />
                    Create New Case
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                {/* Tabs */}
                <div className="macos-tabs">
                  <button 
                    className={`macos-tab ${activeTab === 'case-setup' ? 'active' : ''}`}
                    onClick={() => setActiveTab('case-setup')}
                  >
                    Case Setup
                  </button>
                  <button 
                    className={`macos-tab ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                  >
                    AI Analysis
                  </button>
                  <button 
                    className={`macos-tab ${activeTab === 'report' ? 'active' : ''}`}
                    onClick={() => setActiveTab('report')}
                  >
                    Report
                  </button>
                  <button 
                    className={`macos-tab ${activeTab === 'export' ? 'active' : ''}`}
                    onClick={() => setActiveTab('export')}
                  >
                    Export
                  </button>
                </div>

                {/* Case Setup Tab */}
                {activeTab === 'case-setup' && (
                  <div className="space-y-6">
                    <div className="macos-card p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Case Information</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Case Name *
                            </label>
                            <input
                              type="text"
                              placeholder="Enter case name"
                              value={currentCase.name}
                              onChange={(e) => updateCaseInfo('name', e.target.value)}
                              className="macos-input w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Subject *
                            </label>
                            <input
                              type="text"
                              placeholder="Person or entity being investigated"
                              value={currentCase.subject}
                              onChange={(e) => updateCaseInfo('subject', e.target.value)}
                              className="macos-input w-full"
                            />
                          </div>
                        </div>
                        
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Investigation Notes
                          </label>
                          <textarea
                            placeholder="Add your investigation notes and description of the investigation objectives here..."
                            value={investigationNotes}
                            onChange={(e) => setInvestigationNotes(e.target.value)}
                            className="macos-input w-full h-48 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* File Upload Section */}
                    <div className="macos-card p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Evidence Files</h3>
                      <p className="text-gray-400 mb-4">
                        Upload images, videos, documents, and other evidence files for analysis
                      </p>
                      <FileUpload 
                        files={files}
                        onFilesChange={setFiles}
                        maxFiles={20}
                        maxSizeBytes={200 * 1024 * 1024} // 200MB
                        acceptedTypes={[
                          'image/*', 
                          'video/*', 
                          'audio/*',
                          '.pdf', 
                          '.doc', 
                          '.docx', 
                          '.txt',
                          '.csv',
                          '.json'
                        ]}
                      />
                    </div>

                    <div className="macos-card p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">AI Analysis</h3>
                          <p className="text-gray-400">
                            Run AI analysis to extract entities, relationships, and insights from notes and files
                          </p>
                        </div>
                        <button 
                          onClick={runAIAnalysis}
                          disabled={isAnalyzing || (!investigationNotes.trim() && files.length === 0)}
                          className="macos-button macos-button-success"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="macos-spinner" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4" />
                              Run Analysis
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Tab */}
                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    {isAnalyzing ? (
                      <div className="macos-card p-16 text-center">
                        <div className="macos-spinner w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Running AI Analysis</h3>
                        <p className="text-gray-400">Processing investigation data...</p>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="space-y-6">
                        <div className="macos-card p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Detected Entities</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {aiAnalysis.entities.map((entity) => (
                              <div key={entity.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-blue-400 text-sm font-semibold uppercase">{entity.type}</span>
                                  <span className="text-gray-400 text-xs">{entity.mentions} mentions</span>
                                </div>
                                <p className="text-white font-medium text-lg">{entity.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="macos-card p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">AI Insights</h3>
                          <div className="space-y-4">
                            {aiAnalysis.insights.map((insight) => (
                              <div key={insight.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-blue-400 font-semibold">{insight.title}</h4>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                    insight.impact === 'critical' ? 'bg-red-900 text-red-200' :
                                    insight.impact === 'high' ? 'bg-orange-900 text-orange-200' :
                                    insight.impact === 'medium' ? 'bg-yellow-900 text-yellow-200' :
                                    'bg-green-900 text-green-200'
                                  }`}>
                                    {insight.impact.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-gray-300 mb-2">{insight.description}</p>
                                <div className="text-xs text-gray-400">
                                  Confidence: {Math.round(insight.confidence * 100)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Mind Map Visualization */}
                        <MindMap 
                          entities={aiAnalysis.entities} 
                          relationships={aiAnalysis.relationships}
                          onNodeClick={(entity) => {
                            console.log('Selected entity:', entity);
                            // Could open detailed view or highlight related insights
                          }}
                        />
                      </div>
                    ) : (
                      <div className="macos-card p-16 text-center">
                        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Analysis Data</h3>
                        <p className="text-gray-400 mb-4">
                          Run AI analysis from the Case Setup tab to see results here
                        </p>
                        <button 
                          onClick={() => setActiveTab('case-setup')} 
                          className="macos-button"
                        >
                          Go to Case Setup
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Report Tab */}
                {activeTab === 'report' && (
                  <div className="space-y-6">
                    {isGeneratingReport ? (
                      <div className="macos-card p-16 text-center">
                        <div className="macos-spinner w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Generating Report</h3>
                        <p className="text-gray-400">Creating professional OSINT report...</p>
                      </div>
                    ) : report ? (
                      <div className="space-y-6">
                        <div className="macos-card p-6">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Generated Report</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-400">Generated: {report.generatedAt.toLocaleDateString()}</span>
                              <button 
                                onClick={generateReport}
                                className="macos-button macos-button-success"
                              >
                                <FileText className="h-4 w-4" />
                                Regenerate
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
                            <div className="mb-6 pb-4 border-b border-gray-600">
                              <h2 className="text-2xl font-bold text-white mb-2">{report.metadata.title}</h2>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
                                <div><strong>Investigator:</strong> {report.metadata.investigator}</div>
                                <div><strong>Case ID:</strong> {report.metadata.caseNumber}</div>
                                <div><strong>Pages:</strong> {report.metadata.pageCount}</div>
                                <div><strong>Word Count:</strong> {report.metadata.wordCount}</div>
                              </div>
                            </div>
                            
                            <div className="space-y-6">
                              {report.sections.map((section) => (
                                <div key={section.id} className="space-y-3">
                                  <h4 className="text-lg font-semibold text-blue-400">{section.title}</h4>
                                  <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                                    {section.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="macos-card p-16 text-center">
                        <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Report Generation</h3>
                        <p className="text-gray-400 mb-6">
                          Complete AI analysis to generate professional OSINT reports
                        </p>
                        {aiAnalysis ? (
                          <button 
                            onClick={generateReport}
                            disabled={isGeneratingReport}
                            className="macos-button macos-button-success"
                          >
                            {isGeneratingReport ? (
                              <>
                                <div className="macos-spinner" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4" />
                                Generate Report
                              </>
                            )}
                          </button>
                        ) : (
                          <div>
                            <p className="text-gray-500 mb-4">Please complete AI analysis first</p>
                            <button 
                              onClick={() => setActiveTab('case-setup')} 
                              className="macos-button"
                            >
                              Go to Case Setup
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Export Tab */}
                {activeTab === 'export' && (
                  <div className="macos-card p-16 text-center">
                    <Download className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Export Options</h3>
                    <p className="text-gray-400 mb-6">
                      Generate and export professional reports in multiple formats
                    </p>
                    {report ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <button 
                          onClick={exportReportAsPDF}
                          disabled={isExportingPDF}
                          className="macos-button macos-button-success text-center p-6 flex-col space-y-2"
                        >
                          {isExportingPDF ? (
                            <>
                              <div className="macos-spinner mx-auto" />
                              <span>Exporting...</span>
                            </>
                          ) : (
                            <>
                              <FileDown className="h-8 w-8 mx-auto" />
                              <div>
                                <div className="font-semibold">PDF Export</div>
                                <div className="text-xs text-gray-400">Professional format</div>
                              </div>
                            </>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => {
                            // Create downloadable HTML file
                            const htmlReport = `
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>${report.metadata.title}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f9fafb; }
                                  .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
                                  h1 { color: white; margin: 0; }
                                  h2 { color: #1d4ed8; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
                                  .metadata { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                                  .content { white-space: pre-line; line-height: 1.6; background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                                  .fox-emoji { font-size: 2em; margin-right: 10px; }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <h1><span class="fox-emoji">🦊</span>${report.metadata.title}</h1>
                                </div>
                                <div class="metadata">
                                  <strong>Investigator:</strong> ${report.metadata.investigator}<br>
                                  <strong>Case ID:</strong> ${report.metadata.caseNumber}<br>
                                  <strong>Generated:</strong> ${report.metadata.dateGenerated.toLocaleDateString()}<br>
                                  <strong>Pages:</strong> ${report.metadata.pageCount} | <strong>Words:</strong> ${report.metadata.wordCount}
                                </div>
                                ${report.sections.map(section => 
                                  `<h2>${section.title}</h2><div class="content">${section.content}</div>`
                                ).join('')}
                              </body>
                              </html>
                            `;
                            const blob = new Blob([htmlReport], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${currentCase?.name || 'OSINT-Report'}.html`;
                            a.click();
                            toast.success('Report exported as HTML file!');
                          }}
                          className="macos-button text-center p-6 flex-col space-y-2"
                        >
                          <Globe className="h-8 w-8 mx-auto" />
                          <div>
                            <div className="font-semibold">HTML Export</div>
                            <div className="text-xs text-gray-400">Web format</div>
                          </div>
                        </button>
                        
                        <button 
                          onClick={() => {
                            // Create downloadable text file
                            const reportText = `${report.metadata.title}\n\n` +
                              report.sections.map(section => `${section.title}\n${section.content}\n\n`).join('');
                            const blob = new Blob([reportText], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${currentCase?.name || 'OSINT-Report'}.txt`;
                            a.click();
                            toast.success('Report exported as text file!');
                          }}
                          className="macos-button text-center p-6 flex-col space-y-2"
                        >
                          <FileText className="h-8 w-8 mx-auto" />
                          <div>
                            <div className="font-semibold">TXT Export</div>
                            <div className="text-xs text-gray-400">Plain text</div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-4">Please generate a report first</p>
                        <button 
                          onClick={() => setActiveTab('report')} 
                          className="macos-button"
                        >
                          Go to Report
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
