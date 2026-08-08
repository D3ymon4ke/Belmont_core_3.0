'use client'

import React, { useState } from 'react'
import { Settings, Shield, Bell, Eye, Save, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SettingsPage() {
  const [notifyLikes, setNotifyLikes] = useState(true)
  const [notifyComments, setNotifyComments] = useState(true)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-belmont-rose" />
          Configurações da Conta
        </h1>
        <p className="text-xs text-belmont-text-muted mt-1">
          Gerencie suas preferências de privacidade, notificações e segurança no Belmont Core
        </p>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium">
          Configurações salvas com sucesso!
        </div>
      )}

      {/* Notifications Section */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4 text-belmont-rose" />
          Preferências de Notificações
        </h3>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-3 rounded-xl bg-belmont-surface/50 border border-belmont-border cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-belmont-text-primary">Notificações de Curtidas</p>
              <p className="text-[10px] text-belmont-text-muted">Receber alertas quando curtirem seus posts</p>
            </div>
            <input
              type="checkbox"
              checked={notifyLikes}
              onChange={(e) => setNotifyLikes(e.target.checked)}
              className="accent-belmont-rose w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-belmont-surface/50 border border-belmont-border cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-belmont-text-primary">Notificações de Comentários</p>
              <p className="text-[10px] text-belmont-text-muted">Receber alertas em respostas aos seus tópicos</p>
            </div>
            <input
              type="checkbox"
              checked={notifyComments}
              onChange={(e) => setNotifyComments(e.target.checked)}
              className="accent-belmont-rose w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Password & Security Section */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          Segurança da Conta
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nova Senha" type="password" placeholder="••••••••" />
          <Input label="Confirmar Senha" type="password" placeholder="••••••••" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
