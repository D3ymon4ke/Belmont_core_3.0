'use client'

import React, { useState, useEffect } from 'react'
import { Coins, ArrowDownLeft, ArrowUpRight, ShieldCheck, History, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { getTransactionsService } from '@/lib/services/economy'
import { createClient } from '@/lib/supabase/client'
import { CoinTransaction } from '@/types'

export default function WalletPage() {
  const supabase = createClient()
  const [balance, setBalance] = useState<number>(100)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out' | 'admin'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadWalletData() {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('belmont_coins')
          .eq('id', user.id)
          .single()
        if (profile) setBalance(profile.belmont_coins || 100)
      }

      const txs = await getTransactionsService()
      setTransactions(txs)
      setIsLoading(false)
    }

    loadWalletData()
  }, [])

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'in') return tx.amount > 0 && tx.type !== 'admin'
    if (filterType === 'out') return tx.amount < 0
    if (filterType === 'admin') return tx.type === 'admin'
    return true
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Wallet Header & Balance Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-belmont-border relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Moeda Virtual da Mansão Belmont</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              Carteira & Extrato Econômico
            </h1>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Acompanhe seu saldo em Belmont Coins e o histórico auditado de todas as transações.
            </p>
          </div>

          {/* Balance Widget */}
          <div className="bg-belmont-surface/90 p-5 rounded-2xl border border-belmont-border flex items-center gap-4 min-w-[220px] shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Saldo Atual</p>
              <p className="text-2xl font-extrabold text-amber-300 font-display">{balance} Coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger & Transactions Table Container */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        {/* Header Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-belmont-border">
          <h3 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
            <History className="w-5 h-5 text-belmont-rose" />
            Histórico Auditado de Transações
          </h3>

          <div className="flex items-center gap-1.5 p-1 bg-belmont-surface/80 rounded-xl border border-belmont-border text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'all' ? 'bg-belmont-crimson text-white shadow-sm' : 'text-belmont-text-muted hover:text-belmont-text-primary'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'in' ? 'bg-belmont-crimson text-white shadow-sm' : 'text-belmont-text-muted hover:text-belmont-text-primary'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'out' ? 'bg-belmont-crimson text-white shadow-sm' : 'text-belmont-text-muted hover:text-belmont-text-primary'
              }`}
            >
              Saídas
            </button>
            <button
              onClick={() => setFilterType('admin')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                filterType === 'admin' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-belmont-text-muted hover:text-belmont-text-primary'
              }`}
            >
              Ajustes Admin
            </button>
          </div>
        </div>

        {/* Transactions List */}
        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title="Nenhuma transação encontrada"
            description="Não há registros no histórico para o filtro selecionado."
          />
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const isPositive = tx.amount >= 0
              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-belmont-surface/50 border border-belmont-border/70 flex items-center justify-between hover:bg-belmont-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-belmont-text-primary">{tx.description}</p>
                        <Badge
                          variant={tx.type === 'admin' ? 'gold' : isPositive ? 'success' : 'crimson'}
                          size="sm"
                        >
                          {tx.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-belmont-text-muted mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-extrabold font-display ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? `+${tx.amount}` : tx.amount} Coins
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
