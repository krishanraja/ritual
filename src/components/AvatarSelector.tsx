import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AvatarOption {
  id: string;
  name: string;
  src: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'heart', name: 'Warm', src: '/avatars/avatar-heart.png' },
  { id: 'sparkle', name: 'Playful', src: '/avatars/avatar-sparkle.png' },
  { id: 'zen', name: 'Calm', src: '/avatars/avatar-zen.png' },
  { id: 'explorer', name: 'Adventurer', src: '/avatars/avatar-explorer.png' },
];

interface AvatarSelectorProps {
  selected: string | null;
  onChange: (avatarId: string | null) => void;
  disabled?: boolean;
}

export function AvatarSelector({ selected, onChange, disabled }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATAR_OPTIONS.map((avatar, index) => (
        <motion.button
          key={avatar.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onChange(selected === avatar.id ? null : avatar.id)}
          disabled={disabled}
          className={cn(
            "relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
            selected === avatar.id && "bg-primary/10 ring-2 ring-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted">
            <img 
              src={avatar.src} 
              alt={avatar.name} 
              className="w-full h-full object-cover"
            />
            {selected === avatar.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" />
              </motion.div>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {avatar.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export function getAvatarSrc(avatarId: string | null): string | null {
  if (!avatarId) return null;
  const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
  return avatar?.src || null;
}
