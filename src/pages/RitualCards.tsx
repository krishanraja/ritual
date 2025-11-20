import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Clock, DollarSign, Sparkles, RotateCcw, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ViewCoupleCodeDialog } from "@/components/ViewCoupleCodeDialog";
import { supabase } from "@/integrations/supabase/client";

const MOCK_RITUALS = [
  {
    id: 1,
    title: "Sunset Picnic at the Park",
    category: "Connection",
    description: "Pack your favorite snacks and find a cozy spot to watch the sunset together. Bring a blanket and maybe a portable speaker for soft music.",
    time_estimate: "2 hours",
    budget_band: "$",
  },
  {
    id: 2,
    title: "Morning Coffee & Journaling",
    category: "Rest",
    description: "Start your day together with coffee and 15 minutes of quiet journaling. Share one insight each before continuing your day.",
    time_estimate: "30 min",
    budget_band: "Free",
  },
  {
    id: 3,
    title: "Try a New Recipe Together",
    category: "Fun",
    description: "Pick a cuisine neither of you has cooked before. Make it a mini competition or a collaborative adventure.",
    time_estimate: "1.5 hours",
    budget_band: "$$",
  },
  {
    id: 4,
    title: "Evening Walk & Stargazing",
    category: "Exploration",
    description: "Take a walk to somewhere you haven't been before in your neighborhood. Bring a blanket and spend 20 minutes looking at the stars.",
    time_estimate: "1 hour",
    budget_band: "Free",
  },
];

const RitualCards = () => {
  const [cards, setCards] = useState(MOCK_RITUALS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [couple, setCouple] = useState<any>(null);
  const [showViewCode, setShowViewCode] = useState(false);

  const currentCard = cards[currentIndex];

  // Fetch couple data
  useEffect(() => {
    const fetchCouple = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('couples')
          .select('*')
          .or(`partner_one.eq.${user.id},partner_two.eq.${user.id}`)
          .maybeSingle();
        if (data) setCouple(data);
      }
    };
    fetchCouple();
  }, []);

  const handleSwap = () => {
    // For now, replace with a new mock ritual (different from the ones we have)
    const newRitual = {
      id: Date.now(),
      title: "Sunrise Coffee Date",
      category: "Connection",
      description: "Wake up early together and find a spot to watch the sunrise. Bring a thermos of coffee and enjoy the quiet morning moments.",
      time_estimate: "1 hour",
      budget_band: "$",
    };
    
    const newCards = [...cards];
    newCards[currentIndex] = newRitual;
    setCards(newCards);
  };

  const handleKeep = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  return (
    <div className="min-h-screen bg-gradient-calm flex flex-col p-6">
      {/* Header */}
      <div className="max-w-md mx-auto w-full py-4 relative">
        <h1 className="text-3xl font-bold text-center text-foreground mb-2">
          Your Weekly Rituals
        </h1>
        <p className="text-center text-muted-foreground">
          Swipe to keep or swap rituals
        </p>
        {couple && (
          <Button
            onClick={() => setShowViewCode(true)}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-0 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Code
          </Button>
        )}
      </div>

      {/* Card Stack */}
      <div className="flex-1 flex items-center justify-center relative px-4">
        <div className="w-full max-w-md h-[500px] relative">
          {/* Background stacked cards */}
          {cards.slice(currentIndex + 1, currentIndex + 3).map((ritual, index) => (
            <div
              key={ritual.id}
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translateY(${(index + 1) * 12}px) scale(${1 - (index + 1) * 0.03})`,
                opacity: 0.5 - index * 0.2,
                zIndex: -(index + 1)
              }}
            >
              <Card className="h-full bg-card rounded-3xl shadow-card border-none p-8" />
            </div>
          ))}
          
          <AnimatePresence mode="wait">
            {currentCard && (
              <motion.div
                key={currentCard.id}
                style={{
                  x,
                  rotate,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 100) {
                    if (info.offset.x > 0) {
                      handleKeep();
                    } else {
                      handleSwap();
                    }
                  }
                }}
                className="absolute inset-0 z-10"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full bg-card rounded-3xl shadow-card border-none p-8 flex flex-col">
                  {/* Category Badge */}
                  <div className="inline-flex items-center gap-2 self-start mb-4">
                    <div className="w-2 h-2 rounded-full bg-gradient-ritual" />
                    <span className="text-sm font-medium text-primary">
                      {currentCard.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {currentCard.title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground flex-1 leading-relaxed">
                    {currentCard.description}
                  </p>

                  {/* Meta Info */}
                  <div className="flex gap-4 mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {currentCard.time_estimate}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      {currentCard.budget_band}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-md mx-auto w-full flex gap-4 pt-6">
        <Button
          onClick={handleSwap}
          size="lg"
          variant="outline"
          className="flex-1 border-2 border-primary/30 rounded-2xl h-14 text-lg"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Swap
        </Button>
        
        <Button
          onClick={handleKeep}
          size="lg"
          className="flex-1 bg-gradient-ritual text-white hover:opacity-90 rounded-2xl h-14 text-lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Keep
        </Button>
      </div>

      {/* Progress */}
      <div className="max-w-md mx-auto w-full text-center pt-4 text-sm text-muted-foreground">
        {currentIndex + 1} of {cards.length} rituals
      </div>
      
      {couple && (
        <ViewCoupleCodeDialog 
          open={showViewCode} 
          onOpenChange={setShowViewCode} 
          coupleCode={couple.couple_code} 
        />
      )}
    </div>
  );
};

export default RitualCards;
