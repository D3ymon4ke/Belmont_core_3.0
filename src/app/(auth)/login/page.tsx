'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      router.push('/home')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar na Mansão Belmont. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-belmont-bg flex items-center justify-center p-4 relative overflow-hidden bg-mansion-radial">
      {/* Background Subtle Atmosphere Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-belmont-crimson/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-belmont-rose/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Emblem Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-belmont-crimson to-belmont-rose items-center justify-center text-white shadow-belmont-glow mb-4">
            <span className="font-display font-extrabold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary">
            BELMONT CORE 2.0
          </h1>
          <p className="text-xs text-belmont-text-muted mt-1.5 font-medium">
            Plataforma Social Privada & Exclusiva
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-belmont-card border border-belmont-border">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <Input
              label="E-mail de Acesso"
              type="email"
              placeholder="seu.email@belmont.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-belmont-text-muted hover:text-belmont-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-belmont-text-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Conexão Criptografada
              </span>
              <Link
                href="/recuperar-senha"
                className="text-belmont-rose hover:underline font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Acessar a Mansão
            </Button>
          </form>

          {/* Footer Signup Link */}
          <div className="mt-6 pt-6 border-t border-belmont-border text-center text-xs text-belmont-text-muted">
            Ainda não possui convite ou conta?{' '}
            <Link href="/cadastro" className="text-belmont-text-primary hover:text-belmont-rose font-semibold underline transition-colors">
              Criar Conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
