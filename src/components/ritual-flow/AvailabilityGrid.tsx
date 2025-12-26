/**
 * AvailabilityGrid Component
 * 
 * 7-day availability picker with morning/afternoon/evening slots.
 * Shows both partners' selections and highlights overlaps.
 * 
 * Mobile-optimized with compact layout and abbreviated labels.
 * 
 * @created 2025-12-26
 * @updated 2025-12-26 - Mobile-friendly redesign
 */

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, Clock } from 'lucide-react';
import type { TimeSlot, AvailabilitySlot } from '@/types/database';

interface AvailabilityGridProps {
  mySlots: AvailabilitySlot[];
  partnerSlots: AvailabilitySlot[];
  onToggle: (dayOffset: number, timeSlot: TimeSlot) => void;
  disabled?: boolean;
}

// Compact labels for mobile
const TIME_SLOTS: { id: TimeSlot; label: string; shortLabel: string; time: string }[] = [
  { id: 'morning', label: 'Morning', shortLabel: 'AM', time: '8am-12pm' },
  { id: 'afternoon', label: 'Afternoon', shortLabel: 'PM', time: '12pm-5pm' },
  { id: 'evening', label: 'Evening', shortLabel: 'Eve', time: '5pm-10pm' },
];

export function AvailabilityGrid({ 
  mySlots, 
  partnerSlots, 
  onToggle,
  disabled = false 
}: AvailabilityGridProps) {
  // Generate next 7 days starting from today
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      return {
        offset: i,
        date,
        dayName: format(date, 'EEE'),
        dayLetter: format(date, 'EEEEE'), // Single letter: M, T, W, etc.
        dayNum: format(date, 'd'),
        isToday: i === 0,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      };
    });
  }, []);
  
  // Build lookup sets for quick checking
  const mySlotKeys = useMemo(() => 
    new Set(mySlots.map(s => `${s.day_offset}-${s.time_slot}`)),
    [mySlots]
  );
  
  const partnerSlotKeys = useMemo(() => 
    new Set(partnerSlots.map(s => `${s.day_offset}-${s.time_slot}`)),
    [partnerSlots]
  );
  
  const getSlotState = (dayOffset: number, timeSlot: TimeSlot) => {
    const key = `${dayOffset}-${timeSlot}`;
    const isMine = mySlotKeys.has(key);
    const isPartner = partnerSlotKeys.has(key);
    
    if (isMine && isPartner) return 'overlap';
    if (isMine) return 'mine';
    if (isPartner) return 'partner';
    return 'empty';
  };
  
  // Count overlaps
  const overlapCount = useMemo(() => {
    let count = 0;
    for (const key of mySlotKeys) {
      if (partnerSlotKeys.has(key)) count++;
    }
    return count;
  }, [mySlotKeys, partnerSlotKeys]);
  
  const hasConflict = mySlots.length > 0 && partnerSlots.length > 0 && overlapCount === 0;
  
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">When are you free?</h3>
          <p className="text-xs text-muted-foreground">Tap slots where you're available</p>
        </div>
        {overlapCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            <span>{overlapCount} matching slot{overlapCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      {/* Conflict warning */}
      {hasConflict && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>No overlapping times yet. Try adding more!</span>
          </div>
        </div>
      )}
      
      {/* Compact Grid - fixed column widths */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Day headers - use CSS grid with fixed first column */}
        <div className="grid" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
          <div className="p-1" /> {/* Empty corner */}
          {days.map(day => (
            <div 
              key={day.offset}
              className={cn(
                "py-1.5 px-0.5 text-center border-l",
                day.isToday && "bg-primary/5",
                day.isWeekend && "bg-muted/30"
              )}
            >
              <div className="text-[10px] text-muted-foreground leading-tight">{day.dayName}</div>
              <div className={cn(
                "text-xs font-bold leading-tight",
                day.isToday && "text-primary"
              )}>
                {day.dayNum}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time slots */}
        {TIME_SLOTS.map(slot => (
          <div 
            key={slot.id} 
            className="grid border-t" 
            style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}
          >
            {/* Time label - compact */}
            <div className="p-1 flex items-center justify-center">
              <span className="text-[10px] font-medium text-muted-foreground">
                {slot.shortLabel}
              </span>
            </div>
            
            {/* Slot buttons */}
            {days.map(day => {
              const state = getSlotState(day.offset, slot.id);
              
              return (
                <button
                  key={`${day.offset}-${slot.id}`}
                  onClick={() => !disabled && onToggle(day.offset, slot.id)}
                  disabled={disabled}
                  className={cn(
                    "p-1 border-l transition-all",
                    "hover:bg-muted/50 active:scale-95",
                    disabled && "opacity-50 cursor-not-allowed",
                    day.isToday && "bg-primary/5",
                    day.isWeekend && state === 'empty' && "bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-full aspect-square rounded-md border-2 transition-all",
                    "flex items-center justify-center relative",
                    state === 'empty' && "border-dashed border-muted-foreground/30",
                    state === 'mine' && "border-primary bg-primary/10",
                    state === 'partner' && "border-purple-400 bg-purple-50",
                    state === 'overlap' && "border-green-500 bg-green-100"
                  )}>
                    {state === 'mine' && (
                      <Check className="w-3 h-3 text-primary" />
                    )}
                    {state === 'partner' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    )}
                    {state === 'overlap' && (
                      <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Compact Legend with time info */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded border-2 border-primary bg-primary/10" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded border-2 border-purple-400 bg-purple-50" />
          <span>Partner</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded border-2 border-green-500 bg-green-100" />
          <span>Match!</span>
        </div>
        <span className="text-muted-foreground/60">•</span>
        <span className="text-muted-foreground/80">AM 8-12 | PM 12-5 | Eve 5-10</span>
      </div>
    </div>
  );
}
