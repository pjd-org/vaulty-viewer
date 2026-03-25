import React from 'react'

interface NoteBodyRendererProps {
  html: string
  className?: string
}

export function NoteBodyRenderer({ html, className = '' }: NoteBodyRendererProps) {
  return (
    <div
      className={`note-content text-sm text-slate-700 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
