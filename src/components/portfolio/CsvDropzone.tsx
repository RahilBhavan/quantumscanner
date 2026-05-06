'use client'

import { useRef, useState } from 'react'
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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-14 text-center transition-colors',
        dragging
          ? 'border-ink-dark bg-manila'
          : 'border-tag-edge hover:border-ink-mid hover:bg-manila/50',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <p className="font-stamp text-ink-dark text-4xl leading-none">
        Drop Luggage Here
      </p>
      <div>
        <p className="font-form text-ink-mid text-sm">
          Drop your CSV here or click to browse
        </p>
        <p className="font-form text-ink-faint mt-1 text-xs">
          Up to {MAX_ROWS.toLocaleString()} Bitcoin addresses · .csv format
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
