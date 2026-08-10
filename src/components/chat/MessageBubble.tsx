'use client'

import React from 'react'
import { clsx } from 'clsx'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  const formattedTime = new Date(message.created_at).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={clsx(
        'flex items-end gap-2.5 my-2 max-w-[85%] sm:max-w-[75%]',
        isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {!isCurrentUser && (
        <Avatar
          src={message.sender?.avatar_url}
          fallback={message.sender?.display_name || 'B'}
          size="sm"
          className="shrink-0 mb-1"
        />
      )}

      <div className="space-y-0.5">
        {!isCurrentUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-belmont-text-primary">
              {message.sender?.display_name || 'Membro'}
            </span>
            <Badge variant="gold" size="sm" className="text-[9px] px-1 py-0">
              {message.sender?.rank_title || 'Iniciado'}
            </Badge>
            <span className="text-[9px] text-belmont-text-muted ml-auto">{formattedTime}</span>
          </div>
        )}

        <div
          className={clsx(
            'px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-sm',
            isCurrentUser
              ? 'bg-belmont-crimson text-white rounded-br-none'
              : 'bg-belmont-surface/90 text-belmont-text-primary rounded-bl-none border border-belmont-border'
          )}
        >
          <p>{message.content}</p>
          {isCurrentUser && (
            <div className="text-[9px] text-right text-white/60 mt-0.5">
              {formattedTime}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
