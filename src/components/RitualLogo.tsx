import ritualLogoFull from '@/assets/ritual-logo-full.png';
import ritualIcon from '@/assets/ritual-icon.png';
import { cn } from '@/lib/utils';

interface RitualLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  className?: string;
}

const sizeClasses = {
  xs: 'max-h-6',    // 24px height
  sm: 'max-h-8',    // 32px height
  md: 'max-h-16',   // 64px height
  lg: 'max-h-20',   // 80px height
  xl: 'max-h-24',   // 96px height
};

export function RitualLogo({ size = 'md', variant = 'full', className }: RitualLogoProps) {
  const src = variant === 'full' ? ritualLogoFull : ritualIcon;
  
  return (
    <img
      src={src}
      alt="Ritual"
      className={cn('w-auto h-auto object-contain', sizeClasses[size], className)}
    />
  );
}

export function RitualIcon({ size = 'sm', className }: Omit<RitualLogoProps, 'variant'>) {
  return (
    <img
      src={ritualIcon}
      alt="Ritual"
      className={cn('w-auto h-auto object-contain', sizeClasses[size], className)}
    />
  );
}
