// components/Employee/Projects/ProjectFiles.tsx
"use client";
import { useState } from 'react';
import { ICloudinaryFile } from '@/types/projectmanagement';
import { formatDate } from '@/utils/dateUtils';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  Image,
  File,
  Video,
  Archive,
  Grid,
  List,
  Plus,
  Loader2
} from 'lucide-react';

interface ProjectFilesProps {
  projectId: string;
  attachments?: ICloudinaryFile[];
  onRefresh: () => void;
}

export default function ProjectFiles({ projectId, attachments = [], onRefresh }: ProjectFilesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const getFileIcon = (format: string) => {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv'];
    const archiveFormats = ['zip', 'rar', '7z', 'tar'];

    if (imageFormats.includes(format.toLowerCase())) return Image;
    if (videoFormats.includes(format.toLowerCase())) return Video;
    if (archiveFormats.includes(format.toLowerCase())) return Archive;
    return File;
  };

  const getFileTypeColor = (format: string) => {
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const videoFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv'];
    const documentFormats = ['pdf', 'doc', 'docx', 'txt'];
    const archiveFormats = ['zip', 'rar', '7z', 'tar'];

    if (imageFormats.includes(format.toLowerCase())) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
    if (videoFormats.includes(format.toLowerCase())) return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
    if (documentFormats.includes(format.toLowerCase())) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    if (archiveFormats.includes(format.toLowerCase())) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
    return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = attachments.filter(file => {
    const matchesSearch = file.original_filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || 
      (fileTypeFilter === 'images' && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(file.format.toLowerCase())) ||
      (fileTypeFilter === 'documents' && ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(file.format.toLowerCase())) ||
      (fileTypeFilter === 'videos' && ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(file.format.toLowerCase())) ||
      (fileTypeFilter === 'archives' && ['zip', 'rar', '7z', 'tar'].includes(file.format.toLowerCase()));
    
    return matchesSearch && matchesType;
  });

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingFiles(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('projectId', projectId);

    try {
      const response = await fetch('/api/projects/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      onRefresh();
    } catch (err) {
      console.error('Failed to upload files:', err);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteFile = async (publicId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch('/api/projects/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: [publicId] })
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const toggleFileSelection = (publicId: string) => {
    setSelectedFiles(prev => 
      prev.includes(publicId) 
        ? prev.filter(id => id !== publicId)
        : [...prev, publicId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) return;

    try {
      const response = await fetch('/api/projects/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicIds: selectedFiles })
      });

      if (response.ok) {
        setSelectedFiles([]);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to delete files:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Files</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredFiles.length} of {attachments.length} files
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedFiles.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedFiles.length})
            </button>
          )}
          
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <input
            type="file"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
            disabled={uploadingFiles}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer ${uploadingFiles ? 'cursor-not-allowed' : ''}`}
          >
            {uploadingFiles ? (
              <div className="text-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading files...</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Click to upload</span>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Images, documents, videos up to 10MB each
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="images">Images</option>
            <option value="documents">Documents</option>
            <option value="videos">Videos</option>
            <option value="archives">Archives</option>
          </select>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length > 0 ? (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}`}>
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.format);
            const isSelected = selectedFiles.includes(file.public_id);
            
            if (viewMode === 'grid') {
              return (
                <div key={file.public_id} className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${getFileTypeColor(file.format)}`}>
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFileSelection(file.public_id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2 truncate" title={file.original_filename}>
                      {file.original_filename}
                    </h3>
                    
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Size</span>
                        <span>{formatFileSize(file.bytes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format</span>
                        <span className="uppercase">{file.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <a
                        href={file.secure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="View file"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={file.secure_url}
                        download={file.original_filename}
                        className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.public_id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={file.public_id} className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-sm ${
                  isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFileSelection(file.public_id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      
                      <div className={`p-2 rounded-lg ${getFileTypeColor(file.format)}`}>
                        <FileIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {file.original_filename}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>{formatFileSize(file.bytes)}</span>
                          <span className="uppercase">{file.format}</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <a
                        href={file.secure_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={file.secure_url}
                        download={file.original_filename}
                        className="p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.public_id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No files found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {searchQuery || fileTypeFilter !== 'all'
              ? 'No files match your current search and filters.'
              : 'Upload files to get started with project documentation.'}
          </p>
        </div>
      )}
    </div>
  );
}