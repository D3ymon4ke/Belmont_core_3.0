'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, AtSign, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('O username deve ter pelo menos 3 caracteres alfanuméricos.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username: cleanUsername,
          },
        },
      })

      if (signupError) {
        throw signupError
      }

      router.push('/home')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro no Belmont Core.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-belmont-bg flex items-center justify-center p-4 relative overflow-hidden bg-mansion-radial">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-belmont-crimson/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-belmont-crimson to-belmont-rose items-center justify-center text-white shadow-belmont-glow mb-4">
            <span className="font-display font-extrabold text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary">
            Junte-se ao Belmont Core
          </h1>
          <p className="text-xs text-belmont-text-muted mt-1.5 font-medium">
            Crie sua conta para acessar o ecossistema da Mansão
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-belmont-card border border-belmont-border">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Nome de Exibição"
              type="text"
              placeholder="Ex: Lord Belmont"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Username de Acesso"
              type="text"
              placeholder="lord_belmont"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              leftIcon={<AtSign className="w-4 h-4" />}
            />

            <Input
              label="E-mail"
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Criar Minha Conta
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-belmont-border text-center text-xs text-belmont-text-muted">
            Já possui uma conta na Mansão?{' '}
            <Link href="/login" className="text-belmont-text-primary hover:text-belmont-rose font-semibold underline transition-colors">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
