import React from 'react'
import { Shield, Scroll, CheckCircle2, Feather, Star, BookOpen, Key } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export default function WelcomePage() {
  const directives = [
    { title: 'Confidencialidade de Elite', desc: 'Mantenha o sigilo e a privacidade absoluta de todas as conversas, arquivos e projetos criados na Mansão.' },
    { title: 'Etiqueta de Comunicação', desc: 'Prezar pela civilidade, clareza e respeito mútuo em todos os canais de mensagens e postagens.' },
    { title: 'Contribuição Relevante', desc: 'Compartilhe relatórios técnicos, ideias estratégicas e feedbacks de alto nível para enriquecer a comunidade.' },
    { title: 'Preservação da Ordem Visual', desc: 'Respeite as diretrizes visuais e a atmosfera minimalista e sombria estabelecida no Belmont Core 2.0.' },
  ]

  const historicalArchives = [
    { title: 'Origem & Fundação', icon: Key, desc: 'Criado como um refúgio digital seguro e exclusivo para os membros mais confiáveis da Mansão Belmont.' },
    { title: 'Biblioteca de Conhecimento', icon: BookOpen, desc: 'Espaço reservado para o armazenamento de relatórios, estratégias e código-fonte de alta performance.' },
    { title: 'Código de Honra', icon: Shield, desc: 'Diretrizes permanentes que regem a conduta, segurança e cooperação na comunidade.' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Archive Header Banner */}
      <section className="text-center space-y-4 pt-4 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-belmont-crimson/20 border border-belmont-rose/30 text-xs font-semibold text-rose-300">
          <Feather className="w-4 h-4 text-belmont-rose" />
          <span>Mansão Belmont • Registro Oficial nº 001</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-belmont-text-primary">
          Arquivos da Mansão Belmont
        </h1>
        
        <p className="text-xs sm:text-base text-belmont-text-secondary max-w-2xl mx-auto leading-relaxed">
          Bem-vindo à plataforma privada do Belmont Core. Este espaço une a tradição e o prestígio da Mansão à tecnologia de ponta e comunicação criptografada.
        </p>
      </section>

      {/* Historical Pillars Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {historicalArchives.map((archive, i) => {
          const Icon = archive.icon
          return (
            <div key={i} className="glass-card rounded-2xl p-6 border border-belmont-border space-y-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-belmont-surface-elevated flex items-center justify-center text-belmont-rose border border-belmont-border shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-belmont-text-primary font-display">
                {archive.title}
              </h3>
              <p className="text-xs text-belmont-text-muted leading-relaxed">
                {archive.desc}
              </p>
            </div>
          )
        })}
      </div>

      {/* Directives & Code of Conduct */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-belmont-border space-y-6">
        <div className="flex items-center justify-between border-b border-belmont-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-belmont-text-primary font-display">
                Diretrizes Permanentes
              </h2>
              <p className="text-xs text-belmont-text-muted">Normas e conduta esperada dentro do ecossistema</p>
            </div>
          </div>
          <Badge variant="gold">REGULAMENTO</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directives.map((dir, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-belmont-surface/60 border border-belmont-border/70 space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-belmont-rose shrink-0" />
                <h4 className="text-xs font-bold text-belmont-text-primary">{dir.title}</h4>
              </div>
              <p className="text-xs text-belmont-text-secondary leading-relaxed pl-6">{dir.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Narrative Footer Lore */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-belmont-surface to-belmont-surface-elevated border border-belmont-border text-center space-y-2">
        <h4 className="text-xs font-bold text-belmont-text-primary font-display tracking-widest uppercase">
          A Jornada Belmont Core 2.0
        </h4>
        <p className="text-xs text-belmont-text-muted max-w-xl mx-auto leading-relaxed">
          O Belmont Core continuará a evoluir com os membros da Mansão. Aproveite o Feed exclusivo, o Chat Geral e mantenha sua presença ativa no Command Center.
        </p>
      </section>
    </div>
  )
}
