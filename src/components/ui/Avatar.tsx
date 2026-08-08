'use client'

import React from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'

interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  status?: 'online' | 'offline' | 'away'
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  fallback = 'B',
  size = 'md',
  className,
  status,
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  }

  const initial = (fallback || alt || 'B').charAt(0).toUpperCase()

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={clsx(
          'relative rounded-full overflow-hidden flex items-center justify-center font-semibold bg-gradient-to-br from-belmont-surface-elevated to-belmont-surface text-belmont-text-primary border border-belmont-border shadow-sm',
          sizes[size],
          className
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-belmont-bg',
            statusSizes[size],
            status === 'online' && 'bg-emerald-500',
            status === 'offline' && 'bg-slate-500',
            status === 'away' && 'bg-amber-500'
          )}
        />
      )}
    </div>
  )
}
