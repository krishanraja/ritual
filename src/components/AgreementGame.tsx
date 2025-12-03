import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Clock, Download, Share2, Check, Heart, Coins } from 'lucide-react';
import { downloadICS, generateGoogleCalendarUrl, generateAppleCalendarUrl } from '@/utils/calendarUtils';
import { shareToWhatsApp } from '@/utils/shareUtils';
import { NotificationContainer } from './InlineNotification';
import { format } from 'date-fns';

interface Preference {
  rank: number;
  ritual: any;
  proposedDate?: Date;
  proposedTime?: string;
}

interface AgreementGameProps {
  myPreferences: Preference[];
  partnerPreferences: any[];
  onAgreementReached: (ritual: any, date: string, time: string) => void;
  cycleId: string;
}

export const AgreementGame = ({
  myPreferences,
  partnerPreferences,
  onAgreementReached,
  cycleId
}: AgreementGameProps) => {
  const [stage, setStage] = useState<'compare' | 'flipping' | 'done'>('compare');
  const [selectedOption, setSelectedOption] = useState<'mine' | 'theirs' | 'coin' | 'overlap' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [coinResult, setCoinResult] = useState<'mine' | 'theirs' | null>(null);
  const [finalRitual, setFinalRitual] = useState<any>(null);
  const [finalDate, setFinalDate] = useState<string>('');
  const [finalTime, setFinalTime] = useState<string>('');
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  // Find overlaps
  const myTop = myPreferences.find(p => p.rank === 1)?.ritual;
  const partnerTop = partnerPreferences.find((p: any) => p.rank === 1);

  const perfectMatch = myTop?.title === partnerTop?.ritual_data?.title;
  
  // Check if there's any overlap in top 3
  const myTitles = myPreferences.map(p => p.ritual.title);
  const partnerTitles = partnerPreferences.map((p: any) => p.ritual_data.title);
  const overlap = myTitles.filter(t => partnerTitles.includes(t));

  // Find the best overlap (lowest combined rank)
  const getBestOverlap = () => {
    if (overlap.length === 0) return null;
    return overlap.reduce((best, title) => {
      const myRank = myPreferences.find(p => p.ritual.title === title)?.rank || 999;
      const partnerRank = partnerPreferences.find((p: any) => p.ritual_data.title === title)?.rank || 999;
      const bestRank = myPreferences.find(p => p.ritual.title === best)?.rank || 999;
      const bestPartnerRank = partnerPreferences.find((p: any) => p.ritual_data.title === best)?.rank || 999;
      return (myRank + partnerRank < bestRank + bestPartnerRank) ? title : best;
    });
  };

  const handleResolve = async (choice: 'mine' | 'theirs' | 'coin' | 'overlap', overlapTitle?: string) => {
    try {
      let ritual: any;
      let date: string;
      let time: string;

      if (choice === 'coin') {
        // Show coin flip animation
        setStage('flipping');
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const flip = Math.random() > 0.5;
        setCoinResult(flip ? 'mine' : 'theirs');
        
        ritual = flip ? myTop : partnerTop.ritual_data;
        date = flip ? 
          myPreferences.find(p => p.rank === 1)?.proposedDate?.toISOString().split('T')[0]! :
          partnerTop.proposed_date;
        time = flip ?
          myPreferences.find(p => p.rank === 1)?.proposedTime! :
          partnerTop.proposed_time || '19:00';
        
        // Brief pause to show result
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (choice === 'overlap' && overlapTitle) {
        const myPref = myPreferences.find(p => p.ritual.title === overlapTitle);
        ritual = myPref?.ritual;
        date = myPref?.proposedDate?.toISOString().split('T')[0]!;
        time = myPref?.proposedTime || '19:00';
      } else if (choice === 'mine') {
        ritual = myTop;
        date = myPreferences.find(p => p.rank === 1)?.proposedDate?.toISOString().split('T')[0]!;
        time = myPreferences.find(p => p.rank === 1)?.proposedTime!;
      } else {
        ritual = partnerTop.ritual_data;
        date = partnerTop.proposed_date;
        time = partnerTop.proposed_time || '19:00';
      }

      // Update cycle with agreement
      const { error } = await supabase
        .from('weekly_cycles')
        .update({
          agreement_reached: true,
          agreed_ritual: ritual,
          agreed_date: date,
          agreed_time: time
        })
        .eq('id', cycleId);

      if (error) throw error;

      setFinalRitual(ritual);
      setFinalDate(date);
      setFinalTime(time);
      
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setStage('done');
      setSelectedOption(choice);

    } catch (error) {
      console.error('Error reaching agreement:', error);
      setNotification({ type: 'error', message: 'Failed to save agreement' });
      setStage('compare');
    }
  };

  const handleAddToCalendar = (type: 'download' | 'google' | 'apple') => {
    if (!finalRitual || !finalDate) return;
    
    const dateObj = new Date(finalDate);
    
    if (type === 'download') {
      downloadICS(finalRitual, dateObj, finalTime);
      setNotification({ type: 'success', message: 'Calendar event downloaded!' });
    } else if (type === 'google') {
      const url = generateGoogleCalendarUrl(finalRitual, dateObj, finalTime);
      window.open(url, '_blank');
    } else if (type === 'apple') {
      const url = generateAppleCalendarUrl(finalRitual, dateObj, finalTime);
      window.open(url, '_blank');
    }
    setShowCalendarOptions(false);
  };

  const handleShare = () => {
    if (!finalRitual) return;
    shareToWhatsApp(finalRitual);
  };

  const handleContinue = () => {
    onAgreementReached(finalRitual, finalDate, finalTime);
  };

  // Coin flip animation stage
  if (stage === 'flipping') {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <motion.div className="text-center space-y-6">
          <motion.div
            animate={{ 
              rotateY: [0, 1800],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="w-24 h-24 mx-auto rounded-full bg-gradient-ritual flex items-center justify-center shadow-xl"
          >
            <Coins className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-xl font-bold">Flipping...</h2>
          {coinResult && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-primary"
            >
              {coinResult === 'mine' ? "Your pick won! 🎉" : "Their pick won! 🎉"}
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // Done stage - show confirmation with calendar options
  if (stage === 'done' && finalRitual) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-4 max-w-sm mx-auto"
        >
          {notification && (
            <NotificationContainer
              notification={notification}
              onDismiss={() => setNotification(null)}
            />
          )}
          
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-ritual flex items-center justify-center mb-4"
            >
              <Heart className="w-10 h-10 text-white" fill="currentColor" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-1">It's Locked In! 🎉</h2>
            <p className="text-sm text-muted-foreground">Your ritual is confirmed</p>
          </div>
          
          {/* Ritual Card */}
          <Card className="bg-gradient-ritual text-white border-0 overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-bold text-xl">{finalRitual.title}</h3>
              <p className="text-sm opacity-90 line-clamp-2">{finalRitual.description}</p>
              <div className="flex items-center gap-4 text-sm pt-2 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{finalDate ? format(new Date(finalDate), 'EEE, MMM d') : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{finalTime || '7:00 PM'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Options */}
          <div className="space-y-2">
            <AnimatePresence>
              {showCalendarOptions ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Button
                    onClick={() => handleAddToCalendar('google')}
                    variant="outline"
                    className="w-full h-11 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Add to Google Calendar
                  </Button>
                  <Button
                    onClick={() => handleAddToCalendar('apple')}
                    variant="outline"
                    className="w-full h-11 flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Add to Apple Calendar
                  </Button>
                  <Button
                    onClick={() => handleAddToCalendar('download')}
                    variant="outline"
                    className="w-full h-11 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download .ics File
                  </Button>
                  <Button
                    onClick={() => setShowCalendarOptions(false)}
                    variant="ghost"
                    className="w-full text-sm"
                  >
                    Cancel
                  </Button>
                </motion.div>
              ) : (
                <Button
                  onClick={() => setShowCalendarOptions(true)}
                  variant="outline"
                  className="w-full h-12 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Add to Calendar
                </Button>
              )}
            </AnimatePresence>

            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full h-12 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share via WhatsApp
            </Button>

            <Button
              onClick={handleContinue}
              className="w-full h-12 bg-gradient-ritual text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Done - View Rituals
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Perfect match
  if (perfectMatch) {
    return (
      <div className="h-full overflow-y-auto p-4">
        {notification && (
          <div className="mb-4">
            <NotificationContainer
              notification={notification}
              onDismiss={() => setNotification(null)}
            />
          </div>
        )}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 max-w-sm mx-auto"
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: 2 }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-ritual flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold">Perfect Match! 🎉</h2>
          <p className="text-muted-foreground">
            You both picked the same #1 choice!
          </p>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-left">
              <h3 className="font-bold text-lg mb-2">{myTop.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{myTop.description}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{myPreferences.find(p => p.rank === 1)?.proposedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{myPreferences.find(p => p.rank === 1)?.proposedTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button
            onClick={() => handleResolve('mine')}
            className="w-full h-12 bg-gradient-ritual text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Lock It In!
          </Button>
        </motion.div>
      </div>
    );
  }

  // Overlap in top 3
  if (overlap.length > 0) {
    const bestOverlap = getBestOverlap();
    const bestRitual = myPreferences.find(p => p.ritual.title === bestOverlap)?.ritual;
    
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="space-y-4 max-w-sm mx-auto">
          <div className="text-center">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="w-16 h-16 mx-auto rounded-full bg-gradient-ritual flex items-center justify-center mb-3"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold">Great Minds! ✨</h2>
            <p className="text-sm text-muted-foreground">
              You both have {overlap.length === 1 ? 'this ritual' : 'rituals'} in common
            </p>
          </div>
          
          <div className="space-y-2">
            {overlap.map((title, idx) => {
              const myPref = myPreferences.find(p => p.ritual.title === title);
              const partnerPref = partnerPreferences.find((p: any) => p.ritual_data.title === title);
              const isBest = title === bestOverlap;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={isBest ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20" : "bg-card"}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {isBest && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Best Match</span>}
                          </div>
                          <h3 className="font-bold">{title}</h3>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span>You: #{myPref?.rank}</span>
                            <span>•</span>
                            <span>Them: #{partnerPref?.rank}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          
          <Button
            onClick={() => handleResolve('overlap', bestOverlap!)}
            className="w-full h-12 bg-gradient-ritual text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Go with {bestRitual?.title}
          </Button>
        </div>
      </div>
    );
  }

  // No overlap - need resolution
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4 max-w-sm mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1">Different Picks!</h2>
          <p className="text-sm text-muted-foreground">
            Let's find a fun way to decide
          </p>
        </div>

        <div className="space-y-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  You
                </div>
                <p className="text-xs text-primary font-semibold">Your Top Pick</p>
              </div>
              <h3 className="font-bold">{myTop?.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{myTop?.description}</p>
            </CardContent>
          </Card>

          <div className="text-center text-muted-foreground text-sm">vs</div>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
                  💕
                </div>
                <p className="text-xs text-accent-foreground font-semibold">Their Top Pick</p>
              </div>
              <h3 className="font-bold">{partnerTop?.ritual_data?.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{partnerTop?.ritual_data?.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2 pt-2">
          <Button
            onClick={() => handleResolve('coin')}
            className="w-full h-12 bg-gradient-ritual text-white"
          >
            <Coins className="w-4 h-4 mr-2" />
            Flip a Coin
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleResolve('mine')}
              variant="outline"
              className="h-11"
            >
              Pick Mine
            </Button>
            <Button
              onClick={() => handleResolve('theirs')}
              variant="outline"
              className="h-11"
            >
              Pick Theirs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};