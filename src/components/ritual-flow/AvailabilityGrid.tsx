/**
 * AvailabilityGrid Component
 * 
 * 7-day availability picker with morning/afternoon/evening slots.
 * Shows both partners' selections and highlights overlaps.
 * 
 * @created 2025-12-26
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

const TIME_SLOTS: { id: TimeSlot; label: string; time: string }[] = [
  { id: 'morning', label: 'Morning', time: '8am-12pm' },
  { id: 'afternoon', label: 'Afternoon', time: '12pm-5pm' },
  { id: 'evening', label: 'Evening', time: '5pm-10pm' },
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">When are you free?</h3>
          <p className="text-xs text-muted-foreground">Tap slots where you're available</p>
        </div>
        {overlapCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" />
            <span>{overlapCount} matching {overlapCount === 1 ? 'slot' : 'slots'}</span>
          </div>
        )}
      </div>
      
      {/* Conflict warning */}
      {hasConflict && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>No overlapping times yet. Try adding more availability!</span>
          </div>
        </div>
      )}
      
      {/* Grid */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2" /> {/* Empty corner */}
          {days.map(day => (
            <div 
              key={day.offset}
              className={cn(
                "p-2 text-center border-l",
                day.isToday && "bg-primary/5",
                day.isWeekend && "bg-muted/30"
              )}
            >
              <div className="text-xs text-muted-foreground">{day.dayName}</div>
              <div className={cn(
                "text-sm font-semibold",
                day.isToday && "text-primary"
              )}>
                {day.dayNum}
              </div>
            </div>
          ))}
        </div>
        
        {/* Time slots */}
        {TIME_SLOTS.map(slot => (
          <div key={slot.id} className="grid grid-cols-8 border-b last:border-b-0">
            {/* Time label */}
            <div className="p-2 flex flex-col justify-center">
              <div className="text-xs font-medium">{slot.label}</div>
              <div className="text-[10px] text-muted-foreground">{slot.time}</div>
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
                    "p-2 border-l transition-all relative",
                    "hover:bg-muted/50 active:scale-95",
                    disabled && "opacity-50 cursor-not-allowed",
                    day.isToday && "bg-primary/5",
                    day.isWeekend && state === 'empty' && "bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-full aspect-square rounded-lg border-2 transition-all",
                    "flex items-center justify-center",
                    state === 'empty' && "border-dashed border-muted-foreground/30",
                    state === 'mine' && "border-primary bg-primary/10",
                    state === 'partner' && "border-purple-400 bg-purple-50",
                    state === 'overlap' && "border-green-500 bg-green-100"
                  )}>
                    {state === 'mine' && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                    {state === 'partner' && (
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                    )}
                    {state === 'overlap' && (
                      <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                    )}
                  </div>
                  
                  {/* Best match indicator */}
                  {state === 'overlap' && day.offset === Math.min(...Array.from(mySlotKeys).filter(k => partnerSlotKeys.has(k)).map(k => parseInt(k.split('-')[0]))) && slot.id === 'morning' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">1</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-purple-400 bg-purple-50" />
          <span>Partner</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-100" />
          <span>Match!</span>
        </div>
      </div>
    </div>
  );
}

