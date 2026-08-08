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
        'flex items-end gap-2.5 my-2.5 max-w-[85%] sm:max-w-[75%]',
        isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {!isCurrentUser && (
        <Avatar
          src={message.sender?.avatar_url}
          fallback={message.sender?.display_name || 'B'}
          size="sm"
        />
      )}

      <div className="space-y-1">
        {!isCurrentUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-semibold text-belmont-text-secondary">
              {message.sender?.display_name || 'Membro'}
            </span>
            {message.sender?.is_admin && <Badge variant="crimson" size="sm">ADMIN</Badge>}
            <span className="text-[10px] text-belmont-text-muted">{formattedTime}</span>
          </div>
        )}

        <div
          className={clsx(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm',
            isCurrentUser
              ? 'bg-gradient-to-r from-belmont-crimson to-belmont-rose text-white rounded-br-none shadow-belmont-glow'
              : 'bg-belmont-surface-elevated/90 text-belmont-text-primary rounded-bl-none border border-belmont-border'
          )}
        >
          <p>{message.content}</p>
          {isCurrentUser && (
            <div className="text-[9px] text-right text-rose-200/70 mt-1">
              {formattedTime}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
