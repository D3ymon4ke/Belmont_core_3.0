import { createClient } from '@/lib/supabase/client'
import { BankAccount, BankTransaction } from '@/types'

/**
 * Fetch User Bank Account Details
 */
export async function getBankAccountService(userId?: string): Promise<BankAccount | null> {
  const supabase = createClient()
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetId) return null

    const { data, error } = await (supabase
      .from('bank_accounts') as any)
      .select('*')
      .eq('user_id', targetId)
      .single()

    if (error || !data) {
      // Auto initialize bank account if missing
      const { data: newAccount } = await (supabase
        .from('bank_accounts') as any)
        .upsert({ user_id: targetId, balance: 0, accrued_yield: 0 })
        .select('*')
        .single()

      return (newAccount as BankAccount) || null
    }

    return data as BankAccount
  } catch (e) {
    return null
  }
}

/**
 * Fetch User Bank Transactions History
 */
export async function getBankTransactionsService(userId?: string): Promise<BankTransaction[]> {
  const supabase = createClient()
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetId) return []

    const { data, error } = await (supabase
      .from('bank_transactions') as any)
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as BankTransaction[]
  } catch (e) {
    return []
  }
}

/**
 * Deposit Belmont Coins into Bank Belmont (RPC)
 */
export async function depositBankService(amount: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sessão não autenticada.' }

    const { error } = await (supabase as any).rpc('bank_deposit', {
      p_user_id: user.id,
      p_amount: amount,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao processar depósito.' }
  }
}

/**
 * Withdraw Belmont Coins from Bank Belmont (RPC)
 */
export async function withdrawBankService(amount: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sessão não autenticada.' }

    const { error } = await (supabase as any).rpc('bank_withdraw', {
      p_user_id: user.id,
      p_amount: amount,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao processar saque.' }
  }
}

/**
 * Trigger Idempotent Bank Yield Calculation (RPC)
 */
export async function calculateYieldService(): Promise<number> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await (supabase as any).rpc('calculate_bank_yield_idempotent', {
      p_user_id: user.id,
    })

    if (error || typeof data !== 'number') return 0
    return data
  } catch (e) {
    return 0
  }
}

/**
 * Atomic P2P Coin Transfer Between Mansion Members (RPC)
 */
export async function transferCoinsP2PService(
  recipientId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sessão não autenticada.' }

    const { error } = await (supabase as any).rpc('transfer_coins_p2p', {
      p_sender_id: user.id,
      p_recipient_id: recipientId,
      p_amount: amount,
      p_description: description,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'Erro ao realizar transferência.' }
  }
}
