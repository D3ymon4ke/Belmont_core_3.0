'use client'

import React, { useState } from 'react'
import { ScrollText, Feather, Shield, BookOpen, Users, Star, Archive } from 'lucide-react'

export default function WelcomePage() {
  const [activeSection, setActiveSection] = useState<'mansao' | 'fundadores' | 'codigo' | 'tradicoes' | 'arquivos' | 'historias'>('mansao')

  const sections = [
    { id: 'mansao', title: 'A Mansão', icon: Shield },
    { id: 'fundadores', title: 'Os Fundadores', icon: Users },
    { id: 'codigo', title: 'Código', icon: ScrollText },
    { id: 'tradicoes', title: 'Tradições', icon: Star },
    { id: 'arquivos', title: 'Arquivos', icon: Archive },
    { id: 'historias', title: 'Histórias', icon: BookOpen },
  ]

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Editorial Header */}
      <div className="text-center space-y-2 py-4 border-b border-belmont-border/40">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-belmont-rose/10 border border-belmont-rose/20 text-xs font-semibold text-belmont-rose">
          <Feather className="w-3.5 h-3.5" />
          <span>DOCUMENTO DIGITAL EXCLUSIVO</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-belmont-text-primary uppercase">
          ARQUIVOS DA MANSÃO
        </h1>
        <p className="text-xs sm:text-sm text-belmont-text-secondary italic max-w-lg mx-auto">
          "Antes de fazer parte da Mansão, você precisa conhecer sua história."
        </p>
      </div>

      {/* Editorial Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 select-none">
        {sections.map((sec) => {
          const Icon = sec.icon
          const isActive = activeSection === sec.id
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-belmont-crimson text-white shadow-belmont-glow'
                  : 'bg-belmont-surface/50 text-belmont-text-muted hover:text-belmont-text-primary hover:bg-white/5 border border-belmont-border/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.title}</span>
            </button>
          )
        })}
      </div>

      {/* Editorial Section Body Content */}
      <div className="p-6 rounded-2xl bg-belmont-surface/40 border border-belmont-border space-y-4 leading-relaxed">
        {activeSection === 'mansao' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold font-display text-belmont-text-primary uppercase tracking-wider">
              A Mansão Belmont
            </h2>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              A Mansão Belmont não é um escritório corporativo nem um painel comercial. É um refúgio privado construído para abrigar mentes estratégicas, aliando prestígio, autonomia e honra.
            </p>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Em cada corredor digital do Belmont Core 2.0, a privacidade e o respeito pela linhagem da comunidade são garantidos por criptografia e governança transparente.
            </p>
          </div>
        )}

        {activeSection === 'fundadores' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold font-display text-belmont-text-primary uppercase tracking-wider">
              Os Fundadores
            </h2>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Fundada por visionários comprometidos com a maestria e o livre intercâmbio de ideias, a linhagem Belmont estabeleceu os alicerces da comunidade sobre a lealdade, meritocracia e desenvolvimento contínuo.
            </p>
          </div>
        )}

        {activeSection === 'codigo' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold font-display text-belmont-text-primary uppercase tracking-wider">
              Código de Conduta
            </h2>
            <ul className="space-y-2 text-xs sm:text-sm text-belmont-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-belmont-rose font-bold">I.</span>
                <span><strong>Sigilo Absoluto:</strong> As discussões e registros da Mansão são protegidos e confidenciais.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-belmont-rose font-bold">II.</span>
                <span><strong>Elevação Mútua:</strong> O conhecimento compartilhado fortalece todos os membros.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-belmont-rose font-bold">III.</span>
                <span><strong>Excelência Visual e Técnica:</strong> Manter a ordem, a sobriedade e a integridade da plataforma.</span>
              </li>
            </ul>
          </div>
        )}

        {activeSection === 'tradicoes' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold font-display text-belmont-text-primary uppercase tracking-wider">
              Tradições
            </h2>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Das assembleias de notícias aos ritos da Bolsa Belmont, cada interação gera recompensas (Belmont Coins) e progressão de patentes na comunidade.
            </p>
          </div>
        )}

        {activeSection === 'arquivos' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold font-display text-belmont-text-primary uppercase tracking-wider">
              Registros Históricos
            </h2>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Todos os comunicados oficiais e diretrizes permanecem preservados de forma imutável nos registros do Belmont Core.
            </p>
          </div>
        )}

        {activeSection === 'historias' && (
          <div className="space-y-3">
            <h2 className="text-base font-bold font-display text-belmont-text-primary uppercase tracking-wider">
              Histórias dos Corredores
            </h2>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Cada membro traz sua bagagem e contribui para a lenda viva da Mansão Belmont. Compartilhe suas conquistas no Feed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
