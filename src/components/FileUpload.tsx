import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  Image as ImageIcon, 
  Video, 
  X, 
  Download,
  Eye,
  FileText,
  Calendar,
  HardDrive,
  Camera,
  Music
} from 'lucide-react';
import { UploadedFile } from '@/types/index';
import { toast } from 'sonner';

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
}

export default function FileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeBytes = 100 * 1024 * 1024, // 100MB default
  acceptedTypes = ['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt']
}: FileUploadProps) {
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Extract metadata from files
  const extractMetadata = async (file: File): Promise<any> => {
    const metadata: any = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
    };

    // For images, try to extract dimensions
    if (file.type.startsWith('image/')) {
      try {
        const img = new Image();
        const imageUrl = URL.createObjectURL(file);
        
        return new Promise((resolve) => {
          img.onload = () => {
            metadata.dimensions = {
              width: img.width,
              height: img.height
            };
            URL.revokeObjectURL(imageUrl);
            resolve(metadata);
          };
          img.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            resolve(metadata);
          };
          img.src = imageUrl;
        });
      } catch (error) {
        console.error('Error extracting image metadata:', error);
      }
    }

    // For videos, try to extract duration and dimensions
    if (file.type.startsWith('video/')) {
      try {
        const video = document.createElement('video');
        const videoUrl = URL.createObjectURL(file);
        
        return new Promise((resolve) => {
          video.onloadedmetadata = () => {
            metadata.duration = video.duration;
            metadata.dimensions = {
              width: video.videoWidth,
              height: video.videoHeight
            };
            URL.revokeObjectURL(videoUrl);
            resolve(metadata);
          };
          video.onerror = () => {
            URL.revokeObjectURL(videoUrl);
            resolve(metadata);
          };
          video.src = videoUrl;
        });
      } catch (error) {
        console.error('Error extracting video metadata:', error);
      }
    }

    return metadata;
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: UploadedFile[] = [];
    
    for (const file of acceptedFiles) {
      if (file.size > maxSizeBytes) {
        toast.error(`File ${file.name} is too large. Maximum size: ${formatFileSize(maxSizeBytes)}`);
        continue;
      }

      try {
        // Create file URL for preview
        const url = URL.createObjectURL(file);
        
        // Extract metadata
        const metadata = await extractMetadata(file);
        
        const uploadedFile: UploadedFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: url,
          uploadedAt: new Date(),
          tags: [],
          annotations: [],
          metadata: metadata
        };

        newFiles.push(uploadedFile);
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        toast.error(`Error processing ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }
  }, [files, onFilesChange, maxFiles, maxSizeBytes]);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles
  });

  // Remove file
  const removeFile = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    onFilesChange(files.filter(f => f.id !== fileId));
    toast.success('File removed');
  };

  // Get file icon based on type
  const getFileIcon = (type: string, size: string = 'h-5 w-5') => {
    if (type.startsWith('image/')) return <ImageIcon className={size} />;
    if (type.startsWith('video/')) return <Video className={size} />;
    if (type.startsWith('audio/')) return <Music className={size} />;
    if (type.includes('pdf')) return <FileText className={size} />;
    return <File className={size} />;
  };

  // Get file type label
  const getFileTypeLabel = (type: string) => {
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('document') || type.includes('word')) return 'Document';
    if (type.includes('text')) return 'Text';
    return 'File';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-blue-400 bg-blue-500/10 scale-105'
            : files.length >= maxFiles
            ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
            : 'border-gray-600 hover:border-blue-400 hover:bg-blue-500/5'
        }`}
      >
        <input {...getInputProps()} />
        
        <motion.div
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className={`h-12 w-12 mx-auto mb-4 ${
            isDragActive ? 'text-blue-400' : 'text-gray-400'
          }`} />
          
          {files.length >= maxFiles ? (
            <div>
              <p className="text-gray-500 mb-2">Maximum files reached ({maxFiles})</p>
              <p className="text-sm text-gray-600">Remove files to upload more</p>
            </div>
          ) : isDragActive ? (
            <div>
              <p className="text-blue-400 font-semibold mb-2">Drop files here...</p>
              <p className="text-sm text-gray-400">Images, videos, documents supported</p>
            </div>
          ) : (
            <div>
              <p className="text-white font-semibold mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-400 mb-2">
                Images, videos, PDFs, and documents supported
              </p>
              <p className="text-xs text-gray-500">
                Max {maxFiles} files, {formatFileSize(maxSizeBytes)} per file
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">
              Evidence Files ({files.length}/{maxFiles})
            </h4>
            <button
              onClick={() => {
                files.forEach(file => {
                  if (file.url) URL.revokeObjectURL(file.url);
                });
                onFilesChange([]);
                toast.success('All files removed');
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-gray-700/50 rounded-lg border border-gray-600 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {getFileTypeLabel(file.type)} • {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-red-400 hover:text-red-300 transition-colors ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* File Preview */}
                  {file.type.startsWith('image/') && (
                    <div className="mb-2">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewFile(file)}
                      />
                    </div>
                  )}

                  {file.type.startsWith('video/') && (
                    <div className="mb-2">
                      <video
                        src={file.url}
                        className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewFile(file)}
                        muted
                      />
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Uploaded: {file.uploadedAt.toLocaleDateString()}</span>
                    </div>
                    
                    {file.metadata?.dimensions && (
                      <div className="flex items-center space-x-1">
                        <Camera className="h-3 w-3" />
                        <span>
                          {file.metadata.dimensions.width} × {file.metadata.dimensions.height}
                        </span>
                      </div>
                    )}
                    
                    {file.metadata?.duration && (
                      <div className="flex items-center space-x-1">
                        <Video className="h-3 w-3" />
                        <span>{Math.round(file.metadata.duration)}s</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-gray-600">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Preview</span>
                    </button>
                    
                    <a
                      href={file.url}
                      download={file.name}
                      className="flex items-center space-x-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-800 rounded-lg p-6 max-w-4xl max-h-full overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {previewFile.name}
                </h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="text-center">
                {previewFile.type.startsWith('image/') && (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                  />
                )}

                {previewFile.type.startsWith('video/') && (
                  <video
                    src={previewFile.url}
                    controls
                    className="max-w-full max-h-[70vh] rounded"
                  >
                    Your browser does not support video playback.
                  </video>
                )}

                {!previewFile.type.startsWith('image/') && !previewFile.type.startsWith('video/') && (
                  <div className="py-8">
                    {getFileIcon(previewFile.type, 'h-16 w-16')}
                    <p className="text-gray-400 mt-2">Preview not available for this file type</p>
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      className="inline-flex items-center space-x-2 mt-4 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download File</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 text-sm text-gray-400 space-y-1">
                <p><strong>Size:</strong> {formatFileSize(previewFile.size)}</p>
                <p><strong>Type:</strong> {previewFile.type}</p>
                <p><strong>Uploaded:</strong> {previewFile.uploadedAt.toLocaleString()}</p>
                {previewFile.metadata?.dimensions && (
                  <p><strong>Dimensions:</strong> {previewFile.metadata.dimensions.width} × {previewFile.metadata.dimensions.height}</p>
                )}
                {previewFile.metadata?.duration && (
                  <p><strong>Duration:</strong> {Math.round(previewFile.metadata.duration)} seconds</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}