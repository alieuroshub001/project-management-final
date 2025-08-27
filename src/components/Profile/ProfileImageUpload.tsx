// components/Employee/Profile/ProfileImageUpload.tsx
"use client";
import { useState } from 'react';
import { Camera, Upload, X, Loader2, User, Trash2 } from 'lucide-react';

interface ProfileImageUploadProps {
  currentImage?: string;
  imageType: 'profile' | 'cover';
  onUploadSuccess: (imageUrl: string) => void;
  onRemoveSuccess: () => void;
  className?: string;
}

export default function ProfileImageUpload({ 
  currentImage, 
  imageType, 
  onUploadSuccess, 
  onRemoveSuccess,
  className = "" 
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', imageType);

      const response = await fetch('/api/profile/images', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      onUploadSuccess(data.data.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage || !confirm('Are you sure you want to remove this image?')) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('type', imageType);
      formData.append('removeCurrent', 'true');

      const response = await fetch('/api/profile/images', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove image');
      }

      onRemoveSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setUploading(false);
    }
  };

  if (imageType === 'cover') {
    return (
      <div className={`relative group ${className}`}>
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden rounded-t-xl">
          {currentImage && (
            <img
              src={currentImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-4 right-4 flex space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="cover-upload"
              disabled={uploading}
            />
            <label
              htmlFor="cover-upload"
              className={`p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </label>
            {currentImage && (
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className={`p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="absolute bottom-2 left-2 right-2 bg-red-500 text-white text-xs p-2 rounded">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
        {currentImage ? (
          <img
            src={currentImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-12 h-12 text-gray-400" />
        )}
      </div>
      <div className="absolute bottom-0 right-0 flex space-x-1">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="profile-upload"
          disabled={uploading}
        />
        <label
          htmlFor="profile-upload"
          className={`p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-lg ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Camera className="w-3 h-3" />
          )}
        </label>
        {currentImage && (
          <button
            onClick={handleRemoveImage}
            disabled={uploading}
            className={`p-1.5 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors shadow-lg ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      {error && (
        <div className="absolute -bottom-8 left-0 right-0 bg-red-500 text-white text-xs p-1 rounded text-center">
          {error}
        </div>
      )}
    </div>
  );
}