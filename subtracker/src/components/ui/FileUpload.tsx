"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileText } from "lucide-react";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
}

export function FileUpload({
  onFilesSelected,
  accept = ".pdf,.png,.jpg,.jpeg",
  multiple = true,
  maxSizeMB = 10,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndAdd = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const valid: File[] = [];
      for (const f of Array.from(incoming)) {
        if (f.size > maxSizeMB * 1024 * 1024) {
          setError(`${f.name} exceeds ${maxSizeMB}MB limit`);
          continue;
        }
        valid.push(f);
      }
      if (valid.length > 0) {
        const next = multiple ? [...files, ...valid] : valid.slice(0, 1);
        setFiles(next);
        onFilesSelected(next);
      }
    },
    [files, multiple, maxSizeMB, onFilesSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) validateAndAdd(e.dataTransfer.files);
    },
    [validateAndAdd],
  );

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesSelected(next);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files by dragging or clicking"
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <Upload className="mb-2 h-8 w-8 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-700">
          Drag & drop files here, or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-500">
          PDF, PNG, JPG up to {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) validateAndAdd(e.target.files);
          }}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2" aria-label="Selected files">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {f.name}
              </span>
              <span className="text-xs text-slate-400">
                {(f.size / 1024).toFixed(0)}KB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
