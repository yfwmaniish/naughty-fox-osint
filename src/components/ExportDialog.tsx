import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OSINTReport, ExportOptions } from '@/types';
import { Download, FileText, Globe, FileSpreadsheet } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: OSINTReport;
  onExport: (options: ExportOptions) => void;
}

export default function ExportDialog({ isOpen, onClose, report, onExport }: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeEvidence: true,
    includeTimeline: true,
    watermark: true,
    confidentialityLevel: report.metadata.confidentialityLevel
  });

  const handleExport = () => {
    onExport(exportOptions);
    onClose();
  };

  const formatIcons = {
    pdf: <FileText className="h-4 w-4" />,
    html: <Globe className="h-4 w-4" />,
    docx: <FileSpreadsheet className="h-4 w-4" />
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Report</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: 'pdf' | 'html' | 'docx') =>
                setExportOptions({ ...exportOptions, format: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    {formatIcons.pdf}
                    <span>PDF Document</span>
                  </div>
                </SelectItem>
                <SelectItem value="html">
                  <div className="flex items-center space-x-2">
                    {formatIcons.html}
                    <span>HTML Web Page</span>
                  </div>
                </SelectItem>
                <SelectItem value="docx">
                  <div className="flex items-center space-x-2">
                    {formatIcons.docx}
                    <span>Word Document</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Options */}
          <div className="space-y-3">
            <Label>Include Content</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeEvidence"
                checked={exportOptions.includeEvidence}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includeEvidence: !!checked })
                }
              />
              <Label htmlFor="includeEvidence" className="text-sm">
                Include uploaded evidence and attachments
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeTimeline"
                checked={exportOptions.includeTimeline}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, includeTimeline: !!checked })
                }
              />
              <Label htmlFor="includeTimeline" className="text-sm">
                Include timeline visualization
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="watermark"
                checked={exportOptions.watermark}
                onCheckedChange={(checked) =>
                  setExportOptions({ ...exportOptions, watermark: !!checked })
                }
              />
              <Label htmlFor="watermark" className="text-sm">
                Add watermark and page numbers
              </Label>
            </div>
          </div>

          {/* Security Level */}
          <div className="space-y-2">
            <Label>Confidentiality Level</Label>
            <Select
              value={exportOptions.confidentialityLevel}
              onValueChange={(value) =>
                setExportOptions({ ...exportOptions, confidentialityLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal Use</SelectItem>
                <SelectItem value="confidential">Confidential</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Branding (Placeholder) */}
          <div className="space-y-2">
            <Label>Organization Name (Optional)</Label>
            <Input 
              placeholder="Your Organization"
              value={exportOptions.customBranding?.organizationName || ''}
              onChange={(e) =>
                setExportOptions({
                  ...exportOptions,
                  customBranding: {
                    ...exportOptions.customBranding,
                    organizationName: e.target.value,
                    logo: '',
                    colors: { primary: '#000000', secondary: '#666666' }
                  }
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export {exportOptions.format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}