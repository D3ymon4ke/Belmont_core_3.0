'use client'

import React from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-belmont-bg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

    const variants = {
      primary:
        'bg-gradient-to-r from-belmont-crimson to-belmont-rose text-white hover:brightness-110 shadow-belmont-glow focus:ring-belmont-rose',
      secondary:
        'bg-belmont-surface-elevated text-belmont-text-primary border border-belmont-border hover:bg-belmont-surface-hover hover:border-belmont-border-strong focus:ring-slate-400',
      ghost:
        'bg-transparent text-belmont-text-secondary hover:text-belmont-text-primary hover:bg-white/5 focus:ring-slate-400',
      danger:
        'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 focus:ring-red-500',
      gold:
        'bg-gradient-to-r from-amber-500 to-belmont-gold text-slate-950 font-semibold hover:brightness-110 shadow-gold-glow focus:ring-amber-400',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
