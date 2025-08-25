import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { OSINTReport, ExportOptions } from '@/types';

export const exportToPDF = async (report: OSINTReport, options: ExportOptions): Promise<void> => {
  try {
    // Create a temporary div with the report content
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.padding = '20mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Generate HTML content
    const htmlContent = generateReportHTML(report, options);
    tempDiv.innerHTML = htmlContent;
    
    document.body.appendChild(tempDiv);
    
    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Add watermark if requested
    if (options.watermark) {
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(`${options.confidentialityLevel.toUpperCase()} - Page ${i} of ${pageCount}`, 10, 287);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 150, 287);
      }
    }
    
    // Download the PDF
    pdf.save(`${report.metadata.caseNumber}_report.pdf`);
    
    // Clean up
    document.body.removeChild(tempDiv);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

export const exportToHTML = (report: OSINTReport, options: ExportOptions): void => {
  const htmlContent = generateReportHTML(report, options);
  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.metadata.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .report-header { border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px; }
        .report-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .report-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        .meta-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #2563eb; }
        .content { white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb; }
        .confidentiality { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
        .confidential { background: #fee2e2; color: #dc2626; }
        .restricted { background: #fca5a5; color: #991b1b; }
        .internal { background: #dbeafe; color: #1d4ed8; }
        .public { background: #d1fae5; color: #059669; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
        @media print { body { margin: 0; } .footer { position: fixed; bottom: 0; } }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

  // Create and download the file
  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.metadata.caseNumber}_report.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const generateReportHTML = (report: OSINTReport, options: ExportOptions): string => {
  const confidentialityClass = report.metadata.confidentialityLevel;
  
  return `
    <div class="report-header">
      <h1 class="report-title">${report.metadata.title}</h1>
      <span class="confidentiality ${confidentialityClass}">${report.metadata.confidentialityLevel}</span>
      
      <div class="report-meta">
        <div class="meta-item">
          <strong>Investigator:</strong><br>
          ${report.metadata.investigator}
        </div>
        <div class="meta-item">
          <strong>Case Number:</strong><br>
          ${report.metadata.caseNumber}
        </div>
        <div class="meta-item">
          <strong>Generated:</strong><br>
          ${report.metadata.dateGenerated.toLocaleString()}
        </div>
        <div class="meta-item">
          <strong>Status:</strong><br>
          ${report.status.toUpperCase()}
        </div>
      </div>
    </div>

    ${report.sections
      .sort((a, b) => a.order - b.order)
      .map(section => `
        <div class="section">
          <h2 class="section-title">${section.title}</h2>
          <div class="content">${section.content}</div>
        </div>
      `).join('')}

    <div class="footer">
      <p>
        Generated on ${report.generatedAt.toLocaleString()} | 
        Last modified: ${report.lastModified.toLocaleString()}
        ${options.watermark ? ` | ${options.confidentialityLevel.toUpperCase()}` : ''}
      </p>
      ${options.customBranding?.organizationName ? `
        <p>Generated by: ${options.customBranding.organizationName}</p>
      ` : ''}
    </div>
  `;
};