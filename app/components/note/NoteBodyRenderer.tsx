import React from 'react'

interface NoteBodyRendererProps {
  /** Must be sanitized by the caller before passing (e.g. via sanitize-html). */
  html: string
  className?: string
}

export function NoteBodyRenderer({ html, className = '' }: NoteBodyRendererProps) {
  return (
    <div
      className={`note-content text-sm text-neutral-700 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
