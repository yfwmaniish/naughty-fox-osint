import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Edit3, 
  Save, 
  Eye, 
  X,
  Calendar,
  User,
  Shield
} from 'lucide-react';
import { OSINTReport, ReportSection } from '@/types';

interface ReportViewerProps {
  report: OSINTReport | null;
  onReportUpdate: (report: OSINTReport) => void;
  onExport: (report: OSINTReport, format: 'pdf' | 'html') => void;
}

export default function ReportViewer({ report, onReportUpdate, onExport }: ReportViewerProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Generate a report to see the preview
          </div>
        </CardContent>
      </Card>
    );
  }

  const startEditing = (section: ReportSection) => {
    if (section.editable) {
      setEditingSection(section.id);
      setEditContent(section.content);
    }
  };

  const saveEdit = () => {
    if (editingSection) {
      const updatedSections = report.sections.map(section =>
        section.id === editingSection
          ? { ...section, content: editContent }
          : section
      );
      
      const updatedReport = {
        ...report,
        sections: updatedSections,
        lastModified: new Date()
      };
      
      onReportUpdate(updatedReport);
      setEditingSection(null);
      setEditContent('');
    }
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditContent('');
  };

  const getConfidentialityColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800';
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'confidential': return 'bg-orange-100 text-orange-800';
      case 'restricted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Report Preview</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button onClick={() => onExport(report, 'html')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              HTML
            </Button>
            <Button onClick={() => onExport(report, 'pdf')} size="sm">
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Report Header */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{report.metadata.title}</h1>
              <Badge className={getConfidentialityColor(report.metadata.confidentialityLevel)}>
                {report.metadata.confidentialityLevel.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">Investigator</div>
                  <div className="font-medium">{report.metadata.investigator}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">Case Number</div>
                  <div className="font-medium">{report.metadata.caseNumber}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">Generated</div>
                  <div className="font-medium">{report.metadata.dateGenerated.toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-gray-500">Status</div>
                  <Badge variant="outline" className="capitalize">
                    {report.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Report Sections */}
          {report.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div key={section.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  {section.editable && editingSection !== section.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(section)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {editingSection === section.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[150px]"
                    />
                    <div className="flex items-center space-x-2">
                      <Button onClick={saveEdit} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                      {section.content}
                    </div>
                  </div>
                )}
                
                {report.sections.indexOf(section) < report.sections.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}

          {/* Report Footer */}
          <div className="border-t pt-4 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <div>
                Generated on {report.generatedAt.toLocaleString()} | 
                Last modified: {report.lastModified.toLocaleString()}
              </div>
              <div>
                Page 1 of 1 | {report.metadata.wordCount} words
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}