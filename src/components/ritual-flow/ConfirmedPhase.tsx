/**
 * ConfirmedPhase Component
 * 
 * Shows the locked-in ritual with date/time.
 * Provides calendar integration and sharing options.
 * 
 * @created 2025-12-26
 */

import { motion } from 'framer-motion';
import { Heart, Calendar, Clock, Share2, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { WeeklyCycle, Ritual } from '@/types/database';

interface ConfirmedPhaseProps {
  cycle: WeeklyCycle;
  onViewDetails: () => void;
}

export function ConfirmedPhase({ cycle, onViewDetails }: ConfirmedPhaseProps) {
  const ritual = cycle.agreed_ritual as Ritual | null;
  const agreedDate = cycle.agreed_date;
  const agreedTimeStart = cycle.agreed_time_start || cycle.agreed_time;
  const agreedTimeEnd = cycle.agreed_time_end;
  
  if (!ritual) {
    return null;
  }
  
  // Format date for display
  const dateDisplay = agreedDate 
    ? format(parseISO(agreedDate), 'EEEE, MMMM d')
    : 'Date TBD';
  
  // Format time for display
  const timeDisplay = agreedTimeStart && agreedTimeEnd
    ? `${formatTime(agreedTimeStart)} - ${formatTime(agreedTimeEnd)}`
    : agreedTimeStart
      ? formatTime(agreedTimeStart)
      : 'Time TBD';
  
  // Generate calendar link
  const generateCalendarLink = () => {
    if (!agreedDate || !agreedTimeStart) return '';
    
    const startDateTime = `${agreedDate.replace(/-/g, '')}T${agreedTimeStart.replace(/:/g, '')}00`;
    const endDateTime = agreedTimeEnd 
      ? `${agreedDate.replace(/-/g, '')}T${agreedTimeEnd.replace(/:/g, '')}00`
      : `${agreedDate.replace(/-/g, '')}T${incrementHour(agreedTimeStart).replace(/:/g, '')}00`;
    
    const title = encodeURIComponent(ritual.title);
    const description = encodeURIComponent(ritual.description || '');
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${description}`;
  };
  
  const handleAddToCalendar = () => {
    const link = generateCalendarLink();
    if (link) {
      window.open(link, '_blank');
    }
  };
  
  const handleShare = () => {
    const text = `🎉 Our ritual is locked in!\n\n${ritual.title}\n📅 ${dateDisplay}\n⏰ ${timeDisplay}\n\n${ritual.description}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Our Ritual',
        text: text,
      }).catch(() => {
        // User cancelled or share failed
      });
    } else {
      // Fallback to WhatsApp
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };
  
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6, delay: 0.1 }}
          className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center"
        >
          <Heart className="w-10 h-10 text-white" fill="currentColor" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-1">It's Locked In! 🎉</h2>
          <p className="text-muted-foreground">Your ritual is confirmed</p>
        </motion.div>
        
        {/* Ritual card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-2">{ritual.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {ritual.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  {dateDisplay}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm mt-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  {timeDisplay}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Button
            onClick={handleAddToCalendar}
            variant="outline"
            className="w-full h-11 gap-2"
          >
            <Calendar className="w-4 h-4" />
            Add to Calendar
            <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
          </Button>
          
          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full h-11 gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share via WhatsApp
          </Button>
          
          <Button
            onClick={onViewDetails}
            className="w-full h-12 bg-gradient-to-r from-primary to-purple-500 text-white gap-2"
          >
            <Check className="w-4 h-4" />
            Done - View Rituals
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Helper to format time
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Helper to increment hour by 1
function incrementHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const newHours = (hours + 1) % 24;
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

