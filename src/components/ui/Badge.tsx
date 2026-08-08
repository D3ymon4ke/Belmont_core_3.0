'use client'

import React from 'react'
import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'crimson' | 'gold' | 'outline' | 'success'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors'

  const variants = {
    default: 'bg-belmont-surface-elevated text-belmont-text-secondary border border-belmont-border',
    crimson: 'bg-belmont-crimson/20 text-rose-300 border border-belmont-rose/30',
    gold: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    outline: 'bg-transparent text-belmont-text-muted border border-belmont-border',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span className={clsx(baseStyles, variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}
