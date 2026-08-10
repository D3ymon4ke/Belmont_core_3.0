'use client'

import React from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Profile } from '@/types'

interface MansionStoriesProps {
  members?: Profile[]
  currentUserProfile?: Profile | null
}

export const MansionStories: React.FC<MansionStoriesProps> = ({
  members = [],
  currentUserProfile,
}) => {
  // Default featured members if profiles are empty
  const featured = members.length > 0 ? members : [
    { id: '1', display_name: 'Lord Belmont', username: 'lord', avatar_url: null },
    { id: '2', display_name: 'Sypha', username: 'sypha', avatar_url: null },
    { id: '3', display_name: 'Adrian', username: 'adrian', avatar_url: null },
    { id: '4', display_name: 'Marcelo', username: 'marcelo', avatar_url: null },
  ]

  return (
    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 select-none">
      {/* 1. "Sua Mansão" / Create Story item */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
        <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-belmont-crimson to-belmont-rose group-hover:scale-105 transition-transform">
          <div className="w-full h-full rounded-full bg-belmont-bg p-0.5 flex items-center justify-center relative">
            <Avatar
              src={currentUserProfile?.avatar_url}
              fallback={currentUserProfile?.display_name || 'M'}
              size="md"
              className="w-full h-full"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-belmont-rose text-white flex items-center justify-center border-2 border-belmont-bg">
              <Plus className="w-3 h-3" />
            </div>
          </div>
        </div>
        <span className="text-[10px] font-medium text-belmont-text-secondary group-hover:text-belmont-text-primary transition-colors max-w-[64px] truncate text-center">
          Sua Mansão
        </span>
      </div>

      {/* 2. Member Stories list */}
      {featured.map((m, idx) => (
        <div key={m.id || idx} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-belmont-rose to-belmont-crimson group-hover:scale-105 transition-transform shadow-sm">
            <div className="w-full h-full rounded-full bg-belmont-bg p-0.5 flex items-center justify-center">
              <Avatar
                src={m.avatar_url}
                fallback={m.display_name}
                size="md"
                className="w-full h-full"
              />
            </div>
          </div>
          <span className="text-[10px] font-medium text-belmont-text-secondary group-hover:text-belmont-text-primary transition-colors max-w-[64px] truncate text-center">
            {m.display_name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  )
}
