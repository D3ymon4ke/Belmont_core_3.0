'use client'

import React from 'react'
import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-belmont-surface-elevated/70 border border-belmont-border/50',
        className
      )}
    />
  )
}
