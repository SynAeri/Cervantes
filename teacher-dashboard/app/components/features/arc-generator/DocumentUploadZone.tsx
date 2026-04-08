// Dynamic document upload zone - supports multiple file uploads with drag and drop
// Shows minimal paper animation when processing

'use client';

import { useState, useCallback } from 'react';
import { api } from '../../../lib/api';

interface DocumentUploadZoneProps {
  classId: string;
  onUploadSuccess: (data: any) => void;
}

export function DocumentUploadZone({ classId, onUploadSuccess }: DocumentUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'text/plain'
    );

    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);

    // Simulate processing with paper animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For now, just process the first file
    // TODO: Merge multiple documents
    try {
      const data = await api.arc.uploadRubric(classId, files[0]);
      onUploadSuccess({ ...data, rubric_text: data.text });
    } catch (error) {
      console.error('Upload failed:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-16 transition-all
          ${isDragging ? 'border-terracotta bg-terracotta/5' : 'border-warm-grey bg-warm-white'}
          ${files.length > 0 ? 'border-wheat bg-wheat/5' : ''}
        `}
      >
        {isProcessing ? (
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="animate-bounce">
                <span className="material-symbols-outlined text-6xl text-terracotta">description</span>
              </div>
            </div>
            <p className="text-[13px] font-bold text-primary">Reading documents...</p>
            <p className="text-[11px] text-tertiary mt-1">Analyzing assessment materials</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">upload_file</span>
            <p className="text-[13px] font-bold text-primary mb-2">Drop assessment documents here</p>
            <p className="text-[11px] text-tertiary mb-4">or click to browse</p>
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <span className="inline-block px-6 py-2 bg-terracotta/10 text-terracotta rounded text-[10px] font-extrabold uppercase tracking-widest cursor-pointer hover:bg-terracotta/20 transition-colors">
                Browse Files
              </span>
            </label>
            <p className="text-[10px] text-tertiary/70 mt-4">Supports PDF, DOCX, TXT</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-parchment p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-terracotta">description</span>
                  <div>
                    <p className="text-[12px] font-bold text-primary">{file.name}</p>
                    <p className="text-[10px] text-tertiary">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-tertiary hover:text-critical transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload-more"
            />
            <label htmlFor="file-upload-more">
              <span className="inline-block px-4 py-2 text-[10px] font-bold text-wheat hover:text-wheat/80 cursor-pointer transition-colors uppercase tracking-wide">
                + Add More Files
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Process Button - Bottom Right */}
      {files.length > 0 && !isProcessing && (
        <div className="flex justify-end">
          <button
            onClick={handleProcess}
            className="px-8 py-3 bg-terracotta text-parchment rounded-lg text-[11px] font-extrabold uppercase tracking-widest hover:bg-terracotta/90 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Process Documents
          </button>
        </div>
      )}
    </div>
  );
}
