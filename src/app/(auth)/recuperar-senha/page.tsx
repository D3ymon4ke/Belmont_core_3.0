'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })

      if (resetError) throw resetError
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar instruções de recuperação.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-belmont-bg flex items-center justify-center p-4 relative overflow-hidden bg-mansion-radial">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-belmont-crimson to-belmont-rose items-center justify-center text-white shadow-belmont-glow mb-4">
            <span className="font-display font-extrabold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary">
            Recuperação de Acesso
          </h1>
          <p className="text-xs text-belmont-text-muted mt-1.5 font-medium">
            Enviaremos as instruções de redefinição para o seu e-mail
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-belmont-card border border-belmont-border">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-belmont-text-primary font-display">
                Instruções Enviadas
              </h3>
              <p className="text-xs text-belmont-text-muted">
                Se o e-mail informado estiver cadastrado, você receberá um link seguro para redefinir sua senha.
              </p>
              <Link href="/login" className="inline-block pt-2">
                <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                  {error}
                </div>
              )}

              <Input
                label="Seu E-mail Cadastrado"
                type="email"
                placeholder="seu.email@belmont.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Enviar Link de Recuperação
              </Button>

              <div className="pt-4 border-t border-belmont-border text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs text-belmont-text-muted hover:text-belmont-text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para o Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
