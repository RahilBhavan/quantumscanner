'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { MAX_ROWS } from '@/lib/csv/parse'

/** Props for {@link CsvDropzone}. */
interface CsvDropzoneProps {
  /**
   * Called with the selected or dropped `File` object as soon as a file is
   * chosen. The parent is responsible for reading and parsing the file.
   */
  onFile: (file: File) => void
  /**
   * When `true`, all interaction (click, keyboard, drag-and-drop) is blocked
   * and the zone is rendered with reduced opacity. Useful while a scan is
   * already in progress.
   */
  disabled?: boolean
}

/**
 * Drag-and-drop upload zone for the portfolio CSV scanner.
 *
 * Accepts a `.csv` file either by dragging it onto the zone or by clicking
 * to open the system file picker. Keyboard users can trigger the picker with
 * Enter or Space. Visual feedback is provided during active drag operations
 * via the `dragging` state. The hidden `<input type="file">` is programmatically
 * clicked through a ref to keep the accessible button role on the outer div
 * while still using the native file input for browser compatibility.
 *
 * The row limit ({@link MAX_ROWS}) is surfaced in the helper text so users
 * know the constraint before uploading.
 */
export function CsvDropzone({ onFile, disabled }: CsvDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  /**
   * Guards against undefined files (e.g. when a drag event carries no files)
   * and respects the disabled state before forwarding to the parent callback.
   */
  function handleFile(file: File | undefined) {
    if (!file || disabled) return
    onFile(file)
  }

  /**
   * Prevents the browser's default "open file in tab" behaviour on drop,
   * clears the dragging highlight, and forwards the first dropped file.
   */
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
