import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Image, Video, File } from 'lucide-react';
import { UploadedFile } from '@/types';
import { saveFileToStorage } from '@/lib/storage';

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export default function FileUpload({ files, onFilesChange, maxFiles = 10, maxSize = 100 * 1024 * 1024 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        continue;
      }

      const uploadedFile = await saveFileToStorage(file);
      newFiles.push(uploadedFile);
      setUploadProgress(((i + 1) / acceptedFiles.length) * 100);
    }

    onFilesChange([...files, ...newFiles]);
    setUploading(false);
    setUploadProgress(0);
  }, [files, onFilesChange, maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md', '.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    }
  });

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-2">
                <div>Uploading files...</div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            ) : isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <div className="space-y-2">
                <div className="text-lg font-semibold">Drop files here or click to upload</div>
                <div className="text-sm text-gray-500">
                  Supports images, PDFs, documents, videos, and text files
                </div>
                <div className="text-xs text-gray-400">
                  Maximum {maxFiles} files, {maxSize / 1024 / 1024}MB per file
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Uploaded Files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <div className="font-medium text-sm">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {file.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}