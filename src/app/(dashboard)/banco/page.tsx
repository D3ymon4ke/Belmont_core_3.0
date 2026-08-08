'use client'

import React, { useState, useEffect } from 'react'
import {
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Coins,
  ShieldCheck,
  TrendingUp,
  History,
  CheckCircle2,
  AlertTriangle,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import {
  getBankAccountService,
  getBankTransactionsService,
  depositBankService,
  withdrawBankService,
  transferCoinsP2PService,
  calculateYieldService,
} from '@/lib/services/bank'
import { getAllProfilesService } from '@/lib/services/data'
import { createClient } from '@/lib/supabase/client'
import { BankAccount, BankTransaction, Profile } from '@/types'

export default function BankPage() {
  const supabase = createClient()
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Active Tab: 'deposit' | 'withdraw' | 'transfer'
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit')

  // Form Inputs
  const [amountInput, setAmountInput] = useState<string>('')
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null)
  const [transferDescription, setTransferDescription] = useState<string>('')
  const [searchMemberQuery, setSearchMemberQuery] = useState<string>('')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('belmont_coins')
        .eq('id', user.id)
        .single()
      if (profile) setWalletBalance(profile.belmont_coins ?? 0)

      // Calculate yield idempotently
      await calculateYieldService()

      const bankAcc = await getBankAccountService(user.id)
      setBankAccount(bankAcc)

      const txs = await getBankTransactionsService(user.id)
      setTransactions(txs)
    }

    const allMembers = await getAllProfilesService()
    setMembers(allMembers)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseInt(amountInput)
    if (isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', message: 'Insira um valor válido maior que zero.' })
      return
    }

    const res = await depositBankService(amount)
    if (res.success) {
      setFeedback({ type: 'success', message: `Depósito de ${amount} Coins realizado no Banco Belmont!` })
      setAmountInput('')
      await loadData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao processar depósito.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseInt(amountInput)
    if (isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', message: 'Insira um valor válido maior que zero.' })
      return
    }

    const res = await withdrawBankService(amount)
    if (res.success) {
      setFeedback({ type: 'success', message: `Saque de ${amount} Coins realizado com sucesso!` })
      setAmountInput('')
      await loadData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao processar saque.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecipient) {
      setFeedback({ type: 'error', message: 'Selecione um membro destinatário.' })
      return
    }
    const amount = parseInt(amountInput)
    if (isNaN(amount) || amount <= 0) {
      setFeedback({ type: 'error', message: 'Insira um valor válido maior que zero.' })
      return
    }

    const res = await transferCoinsP2PService(selectedRecipient.id, amount, transferDescription.trim())
    if (res.success) {
      setFeedback({ type: 'success', message: `Transferência de ${amount} Coins enviada para ${selectedRecipient.display_name}!` })
      setAmountInput('')
      setSelectedRecipient(null)
      setTransferDescription('')
      await loadData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao processar transferência.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const filteredMembers = members.filter((m) =>
    m.display_name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
    m.username.toLowerCase().includes(searchMemberQuery.toLowerCase())
  )

  const bankBalance = bankAccount?.balance ?? 0
  const totalPatrimony = walletBalance + bankBalance

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-belmont-border relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-80 h-80 bg-belmont-crimson/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-belmont-rose/10 border border-belmont-rose/20 text-xs font-semibold text-rose-300">
              <Landmark className="w-3.5 h-3.5 text-belmont-rose" />
              <span>Instituição Financeira Privada • Mansão Belmont</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              Banco Belmont
            </h1>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Gerencie seus depósitos bancários, acompanhe rendimentos diários e transfira coins para membros da Mansão.
            </p>
          </div>

          {/* Quick Balance Summary */}
          <div className="flex items-center gap-3 bg-belmont-surface/90 p-4 rounded-2xl border border-belmont-border shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-belmont-rose/15 border border-belmont-rose/30 flex items-center justify-center text-belmont-rose">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Patrimônio Financeiro</p>
              <p className="text-2xl font-extrabold text-belmont-text-primary font-display">{totalPatrimony} Coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patrimony Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-belmont-border space-y-1">
          <span className="text-[10px] uppercase font-bold text-belmont-text-muted">Saldo Disponível (Líquido)</span>
          <p className="text-xl font-bold font-display text-amber-300">{walletBalance} Coins</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-belmont-border space-y-1">
          <span className="text-[10px] uppercase font-bold text-belmont-text-muted">Saldo no Banco Belmont</span>
          <p className="text-xl font-bold font-display text-emerald-400">{bankBalance} Coins</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-belmont-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-belmont-text-muted">Taxa de Rendimento</span>
            <Badge variant="gold" size="sm">1.00% / DIA</Badge>
          </div>
          <p className="text-xl font-bold font-display text-sky-300">+{bankAccount?.accrued_yield ?? 0} Coins acumulados</p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5" /> : <AlertTriangle className="w-4.5 h-4.5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Operations Panel */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-belmont-surface/80 rounded-2xl border border-belmont-border max-w-md">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'deposit'
                ? 'bg-belmont-crimson text-white shadow-sm'
                : 'text-belmont-text-muted hover:text-belmont-text-primary'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Depositar
          </button>

          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'withdraw'
                ? 'bg-belmont-crimson text-white shadow-sm'
                : 'text-belmont-text-muted hover:text-belmont-text-primary'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Sacar
          </button>

          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'transfer'
                ? 'bg-belmont-crimson text-white shadow-sm'
                : 'text-belmont-text-muted hover:text-belmont-text-primary'
            }`}
          >
            <Send className="w-4 h-4" />
            Transferir P2P
          </button>
        </div>

        {/* Tab 1: Depositar */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="space-y-4 max-w-lg">
            <p className="text-xs text-belmont-text-secondary">
              Mova moedas do seu Saldo Disponível ({walletBalance} Coins) para a conta do Banco Belmont para render juros diários.
            </p>

            <Input
              label="Quantidade de Coins para Depositar"
              type="number"
              placeholder="Ex: 50"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="md" leftIcon={<ArrowDownLeft className="w-4 h-4" />}>
              Confirmar Depósito
            </Button>
          </form>
        )}

        {/* Tab 2: Sacar */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="space-y-4 max-w-lg">
            <p className="text-xs text-belmont-text-secondary">
              Resgate moedas do Banco Belmont ({bankBalance} Coins) de volta para o seu Saldo Disponível instantaneamente.
            </p>

            <Input
              label="Quantidade de Coins para Sacar"
              type="number"
              placeholder="Ex: 25"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
            />

            <Button type="submit" variant="secondary" size="md" leftIcon={<ArrowUpRight className="w-4 h-4" />}>
              Confirmar Saque
            </Button>
          </form>
        )}

        {/* Tab 3: Transferir P2P */}
        {activeTab === 'transfer' && (
          <form onSubmit={handleTransfer} className="space-y-5 max-w-xl">
            <p className="text-xs text-belmont-text-secondary">
              Envie Belmont Coins para outro membro cadastrado na Mansão com liquidação atômica instantânea.
            </p>

            {/* Recipient Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-belmont-text-secondary">
                Destinatário da Mansão
              </label>

              {selectedRecipient ? (
                <div className="p-3 rounded-2xl bg-belmont-surface/90 border border-belmont-rose/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={selectedRecipient.avatar_url} fallback={selectedRecipient.display_name} size="md" />
                    <div>
                      <p className="text-xs font-bold text-belmont-text-primary">{selectedRecipient.display_name}</p>
                      <p className="text-[10px] text-belmont-text-muted">@{selectedRecipient.username}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRecipient(null)}>
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-belmont-text-muted absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Pesquisar membro por nome ou @username..."
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                      className="w-full bg-belmont-bg/80 text-xs text-belmont-text-primary pl-9 pr-3 py-2.5 rounded-xl border border-belmont-border focus:border-belmont-rose focus:outline-none"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-1 bg-belmont-surface/40 rounded-xl border border-belmont-border">
                    {filteredMembers.length === 0 ? (
                      <p className="text-xs text-belmont-text-muted text-center py-3">Nenhum membro localizado.</p>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedRecipient(m)}
                          className="w-full p-2 rounded-xl flex items-center gap-3 hover:bg-white/5 text-left transition-colors"
                        >
                          <Avatar src={m.avatar_url} fallback={m.display_name} size="sm" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-belmont-text-primary truncate">{m.display_name}</p>
                            <p className="text-[10px] text-belmont-text-muted truncate">@{m.username}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Quantidade de Coins para Transferir"
              type="number"
              placeholder="Ex: 100"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
            />

            <Input
              label="Descrição / Motivo (Opcional)"
              placeholder="Ex: Pagamento por projeto"
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
            />

            <Button type="submit" variant="gold" size="md" leftIcon={<Send className="w-4 h-4" />}>
              Confirmar Transferência P2P
            </Button>
          </form>
        )}
      </div>

      {/* Bank Transactions Ledger */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
          <History className="w-5 h-5 text-belmont-rose" />
          Extrato do Banco Belmont
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Landmark className="w-6 h-6 text-belmont-rose" />}
            title="Nenhuma movimentação bancária."
            description="Seus depósitos, saques e rendimentos aparecerão neste extrato."
          />
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-belmont-surface/50 border border-belmont-border/70 flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      tx.type === 'deposit' || tx.type === 'yield'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {tx.type === 'deposit' || tx.type === 'yield' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-belmont-text-primary">{tx.description}</p>
                      <Badge variant={tx.type === 'yield' ? 'gold' : 'outline'} size="sm">
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

                <span className={`text-sm font-extrabold font-display ${tx.type === 'withdraw' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {tx.type === 'withdraw' ? `-${tx.amount}` : `+${tx.amount}`} Coins
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
