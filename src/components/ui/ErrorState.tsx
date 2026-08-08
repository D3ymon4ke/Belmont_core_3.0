'use client'

import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocorreu um erro',
  message = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-card rounded-2xl border border-red-500/20 bg-red-950/10 my-4">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mb-3 border border-red-500/20">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-belmont-text-primary font-display">
        {title}
      </h4>
      <p className="text-xs text-belmont-text-muted mt-1 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="secondary"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="mt-4"
        >
          Tentar Novamente
        </Button>
      )}
    </div>
  )
}
