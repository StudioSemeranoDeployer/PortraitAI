
import React, { useRef } from 'react';

interface FileUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div 
      onClick={() => !isLoading && inputRef.current?.click()}
      className={`border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center transition-all cursor-pointer 
        ${isLoading ? 'opacity-50 grayscale' : 'hover:border-indigo-500 hover:bg-slate-800/50'}`}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleChange} 
        className="hidden" 
        accept="image/*"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
          <i className="fas fa-cloud-upload-alt text-2xl text-indigo-400"></i>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-1">Click to Upload Portrait</h3>
          <p className="text-slate-400 text-sm">Supports JPG, PNG, WEBP (Max 5MB)</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
