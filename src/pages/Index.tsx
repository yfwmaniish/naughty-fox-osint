import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  FileText, 
  Upload, 
  Play, 
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Plus,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

import FileUpload from '@/components/FileUpload';
import RichEditor from '@/components/RichEditor';
import AIAnalysisPanel from '@/components/AIAnalysisPanel';
import ReportViewer from '@/components/ReportViewer';
import CaseManager from '@/components/CaseManager';
import ExportDialog from '@/components/ExportDialog';
import MatrixBackground from '@/components/MatrixBackground';
import MindMap from '@/components/MindMap';
import CyberLoader from '@/components/CyberLoader';
import GeminiApiConfig from '@/components/GeminiApiConfig';

import { OSINTCase, UploadedFile, AIAnalysis, OSINTReport, ExportOptions } from '@/types';
import { saveCase, getCases } from '@/lib/storage';
import { simulateGeminiAnalysis, generateMockReport } from '@/lib/mockData';
import { geminiApi } from '@/lib/geminiApi';
import { exportToPDF, exportToHTML } from '@/lib/exportService';
import '../styles/dark-theme.css';

export default function OSINTReportGenerator() {
  const [currentCase, setCurrentCase] = useState<OSINTCase | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [report, setReport] = useState<OSINTReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('case-setup');
  const [geminiApiKey, setGeminiApiKey] = useState('YOUR_GEMINI_API_KEY');
  const [analysisProgress, setAnalysisProgress] = useState(0);

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
    setTags([]);
    setFiles([]);
    setAiAnalysis(null);
    setReport(null);
    setActiveTab('case-setup');
  };

  // Load existing case
  const loadCase = (caseData: OSINTCase) => {
    setCurrentCase(caseData);
    setInvestigationNotes(caseData.description);
    setFiles(caseData.files);
    setAiAnalysis(caseData.aiAnalysis.entities.length > 0 ? caseData.aiAnalysis : null);
    setReport(caseData.report.sections.length > 0 ? caseData.report : null);
    setActiveTab('case-setup');
  };

  // Save current case - only manual save to prevent popups
  const saveCurrentCase = () => {
    if (!currentCase) return;
    
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
      toast.success('Case saved successfully');
    } catch (error) {
      console.error('Failed to save case:', error);
      toast.error('Failed to save case');
    }
  };

  // Update case basic info
  const updateCaseInfo = (field: string, value: string) => {
    if (!currentCase) return;
    
    setCurrentCase({
      ...currentCase,
      [field]: value,
      updatedAt: new Date()
    });
  };

  // Run AI analysis
  const runAIAnalysis = async () => {
    if (!currentCase) return;
    
    if (!investigationNotes.trim() && files.length === 0) {
      toast.error('Please add investigation notes or upload files before running analysis');
      return;
    }

    setIsAnalyzing(true);
    setActiveTab('analysis');
    
    try {
      // Convert UploadedFile[] to File[] for real API analysis
      const fileObjects = files.map(f => {
        // Create a File object with the actual content
        const blob = new Blob([f.url], { type: f.type });
        return new File([blob], f.name, { type: f.type });
      });
      
      // Use real Gemini API instead of simulation
      toast.info('Connecting to Gemini AI...', { duration: 2000 });
      const analysis = await geminiApi.analyzeContent(investigationNotes, fileObjects);
      
      setAiAnalysis(analysis);
      
      // Update case status
      setCurrentCase({
        ...currentCase,
        status: 'analyzed',
        aiAnalysis: analysis,
        updatedAt: new Date()
      });
      
      if (analysis.confidence > 0.1) {
        toast.success(`AI analysis completed successfully (Confidence: ${Math.round(analysis.confidence * 100)}%)`);
      } else {
        toast.warning('Analysis completed with low confidence. Please review results carefully.');
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to mock analysis if API fails
      try {
        toast.info('Falling back to demo analysis...');
        const fileObjects = files.map(f => {
          const blob = new Blob([f.url], { type: f.type });
          return new File([blob], f.name, { type: f.type });
        });
        
        const fallbackAnalysis = await simulateGeminiAnalysis(investigationNotes, fileObjects);
        setAiAnalysis(fallbackAnalysis);
        
        setCurrentCase({
          ...currentCase,
          status: 'analyzed',
          aiAnalysis: fallbackAnalysis,
          updatedAt: new Date()
        });
        
        toast.warning('Using demo analysis due to API error');
      } catch (fallbackError) {
        toast.error('Both real and demo analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate report
  const generateReport = async () => {
    if (!currentCase || !aiAnalysis) {
      toast.error('Please run AI analysis first');
      return;
    }

    setIsGeneratingReport(true);
    setActiveTab('report');
    
    try {
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedReport = generateMockReport(currentCase);
      setReport(generatedReport);
      
      // Update case status
      setCurrentCase({
        ...currentCase,
        status: 'completed',
        report: generatedReport,
        updatedAt: new Date()
      });
      
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Report generation failed. Please try again.');
      console.error('Report generation error:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handle export
  const handleExport = async (exportOptions: ExportOptions) => {
    if (!report) return;
    
    try {
      if (exportOptions.format === 'pdf') {
        await exportToPDF(report, exportOptions);
      } else if (exportOptions.format === 'html') {
        exportToHTML(report, exportOptions);
      }
      toast.success(`Report exported as ${exportOptions.format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Export error:', error);
    }
  };

  // Initialize dark theme on mount - NO AUTO-SAVE
  useEffect(() => {
    // Apply dark theme to body
    document.body.classList.add('dark-theme');
    document.documentElement.classList.add('dark-theme');
    
    return () => {
      document.body.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark-theme');
    };
  }, []);

  return (
    <div className="min-h-screen dark-theme data-grid bg-primary text-primary">
      <MatrixBackground />
      
      {/* Header */}
      <div className="terminal-window mb-6">
        <div className="terminal-header">
          <div className="terminal-dot red"></div>
          <div className="terminal-dot yellow"></div>
          <div className="terminal-dot green"></div>
          <span className="text-neon-green font-mono text-sm ml-4">OSINT-ANALYZER v2.0.1</span>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between p-4">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="h-8 w-8 text-neon-green pulse-glow" />
              <div>
                <h1 className="text-xl font-bold text-neon-green glitch-text">OSINT REPORT GENERATOR</h1>
                <p className="text-sm text-neon-blue typing-text">AI-POWERED INTELLIGENCE ANALYSIS PLATFORM</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-3">
              {currentCase && (
                <Badge variant="outline" className="flex items-center space-x-1 border-neon-green text-neon-green">
                  <Clock className="h-3 w-3" />
                  <span className="capitalize">{currentCase.status}</span>
                </Badge>
              )}
              
              <Button onClick={saveCurrentCase} variant="outline" size="sm" disabled={!currentCase} className="neon-button">
                <CheckCircle className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Case Management */}
          <div className="lg:col-span-1">
            <CaseManager
              onCaseSelect={loadCase}
              onNewCase={createNewCase}
              selectedCaseId={currentCase?.id}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!currentCase ? (
              <Card className="cyber-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Brain className="h-16 w-16 text-neon-green mb-4 pulse-glow" />
                  <h2 className="text-2xl font-semibold text-neon-green mb-2 glitch-text">
                    Welcome to OSINT Report Generator
                  </h2>
                  <p className="text-neon-blue text-center mb-6 typing-text">
                    Create a new case or select an existing one to start your OSINT investigation
                  </p>
                  <Button onClick={createNewCase} size="lg" className="neon-button">
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Case
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-black/80 border border-neon-green/50">
                  <TabsTrigger value="case-setup" className="text-neon-green data-[state=active]:bg-neon-green/20 data-[state=active]:text-black">Case Setup</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-neon-green data-[state=active]:bg-neon-green/20 data-[state=active]:text-black">AI Analysis</TabsTrigger>
                  <TabsTrigger value="mindmap" className="text-neon-green data-[state=active]:bg-neon-green/20 data-[state=active]:text-black">Mind Map</TabsTrigger>
                  <TabsTrigger value="report" className="text-neon-green data-[state=active]:bg-neon-green/20 data-[state=active]:text-black">Report</TabsTrigger>
                  <TabsTrigger value="export" className="text-neon-green data-[state=active]:bg-neon-green/20 data-[state=active]:text-black">Export</TabsTrigger>
                  <TabsTrigger value="config" className="text-neon-blue data-[state=active]:bg-neon-blue/20 data-[state=active]:text-black">Config</TabsTrigger>
                </TabsList>

                <TabsContent value="case-setup" className="space-y-6">
                  {/* Case Information */}
                  <Card className="cyber-card">
                    <CardHeader>
                      <CardTitle className="text-neon-green">Case Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="caseName" className="text-neon-green">Case Name *</Label>
                          <Input
                            id="caseName"
                            placeholder="Enter case name"
                            value={currentCase.name}
                            onChange={(e) => updateCaseInfo('name', e.target.value)}
                            className="cyber-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="subject" className="text-neon-green">Subject *</Label>
                          <Input
                            id="subject"
                            placeholder="Person or entity being investigated"
                            value={currentCase.subject}
                            onChange={(e) => updateCaseInfo('subject', e.target.value)}
                            className="cyber-input"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description" className="text-neon-green">Case Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Brief description of the investigation objectives"
                          value={currentCase.description}
                          onChange={(e) => updateCaseInfo('description', e.target.value)}
                          className="cyber-input"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Investigation Notes */}
                  <RichEditor
                    content={investigationNotes}
                    onContentChange={setInvestigationNotes}
                    tags={tags}
                    onTagsChange={setTags}
                  />

                  {/* File Upload */}
                  <FileUpload
                    files={files}
                    onFilesChange={setFiles}
                    maxFiles={20}
                    maxSize={100 * 1024 * 1024}
                  />

                  {/* Analysis Action */}
                  <Card className="cyber-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-neon-green">Ready for AI Analysis</h3>
                          <p className="text-sm text-gray-400">
                            Run AI analysis to extract entities, relationships, and insights
                          </p>
                        </div>
                        <Button 
                          onClick={runAIAnalysis} 
                          disabled={isAnalyzing || (!investigationNotes.trim() && files.length === 0)}
                          className="neon-button"
                        >
                          {isAnalyzing ? (
                            <div className="flex items-center">
                              <div className="cyber-spinner w-4 h-4 mr-2" />
                              Analyzing...
                            </div>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              Run AI Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-6">
                  {isAnalyzing ? (
                    <Card className="cyber-card">
                      <CardContent className="py-16">
                        <CyberLoader text="Running AI Analysis" progress={analysisProgress} showProgress />
                      </CardContent>
                    </Card>
                  ) : (
                    <AIAnalysisPanel analysis={aiAnalysis} isAnalyzing={isAnalyzing} />
                  )}
                  
                  {aiAnalysis && !isAnalyzing && (
                    <Card className="cyber-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-neon-green">Generate Professional Report</h3>
                            <p className="text-sm text-gray-400">
                              Create a comprehensive OSINT report based on AI analysis
                            </p>
                          </div>
                          <Button onClick={generateReport} disabled={isGeneratingReport} className="neon-button">
                            {isGeneratingReport ? (
                              <div className="flex items-center">
                                <div className="cyber-spinner w-4 h-4 mr-2" />
                                Generating...
                              </div>
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Report
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="mindmap" className="space-y-6">
                  <MindMap
                    entities={aiAnalysis?.entities || []}
                    relationships={aiAnalysis?.relationships || []}
                    onNodeClick={(entity) => {
                      toast.info(`Selected entity: ${entity.value} (${entity.type})`);
                    }}
                  />
                </TabsContent>

                <TabsContent value="report" className="space-y-6">
                  <ReportViewer
                    report={report}
                    onReportUpdate={setReport}
                    onExport={(rep, format) => handleExport({ format, includeEvidence: true, includeTimeline: true, watermark: true, confidentialityLevel: rep.metadata.confidentialityLevel })}
                  />
                </TabsContent>

                <TabsContent value="export" className="space-y-6">
                  {report ? (
                    <Card className="cyber-card">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2 text-neon-green">
                          <Download className="h-5 w-5" />
                          <span>Export Options</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button 
                            onClick={() => setShowExportDialog(true)}
                            className="h-24 flex-col space-y-2 neon-button"
                          >
                            <FileText className="h-8 w-8" />
                            <span>Advanced Export</span>
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleExport({ format: 'pdf', includeEvidence: true, includeTimeline: true, watermark: true, confidentialityLevel: report.metadata.confidentialityLevel })}
                            className="h-24 flex-col space-y-2 neon-button info"
                          >
                            <FileText className="h-8 w-8" />
                            <span>Quick PDF Export</span>
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={() => handleExport({ format: 'html', includeEvidence: true, includeTimeline: true, watermark: true, confidentialityLevel: report.metadata.confidentialityLevel })}
                            className="h-24 flex-col space-y-2 neon-button info"
                          >
                            <Globe className="h-8 w-8" />
                            <span>HTML Export</span>
                          </Button>
                        </div>

                        <Alert className="border-neon-green">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-gray-300">
                            All exports include encryption and watermarking for security. 
                            Reports are generated with proper chain of custody documentation.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="cyber-card">
                      <CardContent className="text-center py-16">
                        <FileText className="h-16 w-16 text-neon-green mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neon-green mb-2">No Report Available</h3>
                        <p className="text-gray-400 mb-4">
                          Generate a report first to access export options
                        </p>
                        <Button onClick={() => setActiveTab('analysis')} className="neon-button">
                          Go to Analysis
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="config" className="space-y-6">
                  <GeminiApiConfig
                    onApiKeyUpdate={(apiKey) => {
                      setGeminiApiKey(apiKey);
                      geminiApi.setConfig({
                        apiKey,
                        model: 'gemini-pro',
                        safetySettings: {
                          harassment: true,
                          hateSpeech: true,
                          sexuallyExplicit: true,
                          dangerousContent: true
                        }
                      });
                      toast.success('Gemini API configured successfully');
                    }}
                    currentApiKey={geminiApiKey}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      {report && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          report={report}
          onExport={handleExport}
        />
      )}
    </div>
  );
}