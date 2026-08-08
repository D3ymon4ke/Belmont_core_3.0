'use client'

import React from 'react'
import { Inbox } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-card rounded-2xl border border-belmont-border my-4">
      <div className="w-12 h-12 rounded-2xl bg-belmont-surface-elevated flex items-center justify-center text-belmont-text-secondary mb-3 border border-belmont-border">
        {icon || <Inbox className="w-6 h-6 text-belmont-rose" />}
      </div>
      <h4 className="text-base font-semibold text-belmont-text-primary font-display">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-belmont-text-muted mt-1 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="secondary" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
