'use client'

import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAX_ROWS } from '@/lib/csv/parse'

interface CsvDropzoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

export function CsvDropzone({ onFile, disabled }: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File | undefined) {
    if (!file || disabled) return
    onFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload CSV file"
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer',
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <UploadCloud className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="font-medium">Drop your CSV here or click to browse</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Up to {MAX_ROWS.toLocaleString()} Bitcoin addresses · .csv format
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
