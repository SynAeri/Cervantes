// Rubric upload component with drag-and-drop support
// Handles file upload and parsing for arc generation

'use client';

import { useState, useCallback } from 'react';
import { useUploadRubric } from '../../../hooks/useArcMutations';

interface RubricUploadProps {
  classId: string;
  onUploadSuccess: (data: any) => void;
}

export function RubricUpload({ classId, onUploadSuccess }: RubricUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const uploadMutation = useUploadRubric();

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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadMutation.mutateAsync({ classId, file: selectedFile });
      onUploadSuccess(result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
      <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-[0.2em] mb-6">
        Upload Assessment Materials
      </h3>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragging ? 'border-terracotta bg-terracotta/5' : 'border-warm-grey hover:border-terracotta/50'}
          ${selectedFile ? 'bg-wheat-gold/5' : ''}
        `}
      >
        <input
          type="file"
          id="rubric-upload"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
        />

        {!selectedFile ? (
          <>
            <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">
              upload_file
            </span>
            <p className="text-[14px] font-bold text-primary mb-2">
              Drag and drop your rubric file here
            </p>
            <p className="text-[12px] text-tertiary mb-6">
              or click to browse (PDF, DOCX, TXT)
            </p>
            <label
              htmlFor="rubric-upload"
              className="inline-block px-6 py-3 bg-terracotta text-parchment rounded-lg text-[11px] font-extrabold uppercase tracking-widest cursor-pointer hover:bg-terracotta/90 transition-colors"
            >
              Browse Files
            </label>
          </>
        ) : (
          <div className="space-y-4">
            <span className="material-symbols-outlined text-6xl text-wheat-gold mb-4 block">
              description
            </span>
            <p className="text-[14px] font-bold text-primary">{selectedFile.name}</p>
            <p className="text-[12px] text-tertiary">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 text-[11px] font-extrabold text-tertiary uppercase tracking-widest hover:text-terracotta transition-colors"
              >
                Remove
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="px-6 py-3 bg-terracotta text-parchment rounded-lg text-[11px] font-extrabold uppercase tracking-widest hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload & Parse'}
              </button>
            </div>
          </div>
        )}
      </div>

      {uploadMutation.isError && (
        <div className="mt-4 p-4 bg-critical/10 border border-critical/30 rounded-lg">
          <p className="text-[12px] text-critical font-bold">
            Upload failed: {uploadMutation.error.message}
          </p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <h4 className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
          Upload History
        </h4>
        <p className="text-[12px] text-tertiary italic">No previous uploads</p>
      </div>
    </div>
  );
}
