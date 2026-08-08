'use client'

import React from 'react'
import { clsx } from 'clsx'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-belmont-text-secondary">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={clsx(
            'w-full bg-belmont-surface/80 text-belmont-text-primary text-sm rounded-xl border border-belmont-border px-3.5 py-2.5 transition-all duration-200 focus:outline-none focus:border-belmont-rose focus:ring-1 focus:ring-belmont-rose placeholder:text-belmont-text-muted/60 resize-none min-h-[90px]',
            error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
