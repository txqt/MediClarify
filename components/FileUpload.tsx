import React, { useState, useRef } from 'react';
import { FileData } from '../types';
import { fileToBase64 } from '../services/geminiService';

interface FileUploadProps {
  onFileUpload: (data: FileData) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper: Optimize Image (Resize & Compress)
  const optimizeImage = (file: File): Promise<{ base64: string, previewUrl: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension limit (1568px is optimal for Gemini Vision to avoid tiling overhead)
          const MAX_DIMENSION = 1568; 

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.8 quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = optimizedDataUrl.split(',')[1];
          
          resolve({
            base64,
            previewUrl: optimizedDataUrl,
            mimeType: 'image/jpeg'
          });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processFile = async (file: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or PDF file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB limit (Flash handles larger files, but we optimize anyway)
      setError("File size must be under 20MB.");
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 80) return 80;
        return prev + 10;
      });
    }, 100);

    try {
      let result;
      
      // If it's an image, optimize it. If PDF, use raw.
      if (file.type.startsWith('image/')) {
        result = await optimizeImage(file);
      } else {
        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        result = { base64, previewUrl, mimeType: file.type };
      }

      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        onFileUpload({
          file, // Keep original file object for reference/name
          base64: result.base64,
          previewUrl: result.previewUrl,
          mimeType: result.mimeType
        });
        setIsProcessing(false);
        setUploadProgress(0);
      }, 300);
      
    } catch (err) {
      clearInterval(interval);
      setIsProcessing(false);
      console.error(err);
      setError("Failed to process file. Please try again.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }
          ${(disabled || isProcessing) ? 'opacity-75 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          disabled={disabled || isProcessing}
        />
        
        <div className="space-y-4">
          {!isProcessing ? (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  We optimize images automatically for faster results.
                </p>
              </div>
            </>
          ) : (
            <div className="max-w-xs mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <p className="text-slate-700 font-medium mb-2">Optimizing & Analyzing...</p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;